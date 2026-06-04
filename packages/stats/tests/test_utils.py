from dataclasses import asdict
from functools import partial
from unittest import TestCase, main as unittest_main

import numpy as np
from scipy.stats import norm
import copy

from gbstats.utils import multinomial_covariance, truncated_normal_mean, check_srm
from scipy.stats import truncnorm
from scipy.stats.distributions import chi2

DECIMALS = 5
round_ = partial(np.round, decimals=DECIMALS)


class TestTruncatedNormalMean(TestCase):
    def _scipy_ref(self, mu, sigma, a, b):
        alpha, beta = (a - mu) / sigma, (b - mu) / sigma
        mn, *_ = truncnorm.stats(alpha, beta, loc=mu, scale=sigma, moments="mvsk")
        return float(mn)

    def test_matches_scipy_below_threshold(self):
        # For |beta| < 1e3 we still delegate to scipy, so result must be bit-exact.
        for beta_mag in (10.0, 100.0, 999.0):
            mu, sigma = beta_mag, 1.0  # b=0 => beta = -mu/sigma = -beta_mag
            got = truncated_normal_mean(mu=mu, sigma=sigma, a=-np.inf, b=0.0)
            want = self._scipy_ref(mu=mu, sigma=sigma, a=-np.inf, b=0.0)
            self.assertEqual(got, want)
            # mirror: upper tail
            got_u = truncated_normal_mean(mu=-mu, sigma=sigma, a=0.0, b=np.inf)
            want_u = self._scipy_ref(mu=-mu, sigma=sigma, a=0.0, b=np.inf)
            self.assertEqual(got_u, want_u)

    def test_mills_asymptotic_extreme_beta(self):
        # For |beta| >= 1e3 we use the Mills asymptotic b + sigma**2/(b - mu).
        # It must be finite and agree with the analytic form.
        sigma = 4.5e-9
        for mu in (4.5e-6, 4.5e-3, 4.5, 10.8):  # |beta| = 1e3, 1e6, 1e9, 2.4e9
            got = truncated_normal_mean(mu=mu, sigma=sigma, a=-np.inf, b=0.0)
            self.assertTrue(np.isfinite(got))
            analytic = 0.0 + sigma**2 / (0.0 - mu)
            self.assertAlmostEqual(got / analytic, 1.0, places=6)
            self.assertLess(got, 0.0)  # E[X | X < 0] must be negative
            # mirror: upper tail
            got_u = truncated_normal_mean(mu=-mu, sigma=sigma, a=0.0, b=np.inf)
            self.assertTrue(np.isfinite(got_u))
            self.assertAlmostEqual(got_u / (-analytic), 1.0, places=6)

    def test_no_overflow_at_repro_point(self):
        # Regression: this used to raise OverflowError inside scipy truncnorm.
        got = truncated_normal_mean(mu=0.01, sigma=4.5e-9, a=-np.inf, b=0.0)
        self.assertTrue(np.isfinite(got))


class TestMultinomial(TestCase):
    def setUp(self):
        self.seed = 20251204
        rng_nu = np.random.default_rng(seed=self.seed)
        self.num_cells = 5
        nu = rng_nu.uniform(size=self.num_cells)
        nu = nu / np.sum(nu)
        self.nu = nu
        self.size = 1000000
        self.n = 1000

    def test_multinomial_covariance(self):
        rng_data = np.random.default_rng(seed=self.seed + 1)
        data = rng_data.multinomial(n=1, pvals=self.nu, size=self.size)
        v_theoretical = multinomial_covariance(self.nu)
        v_empirical = np.cov(data, rowvar=False, ddof=1)
        self.assertTrue(np.allclose(v_theoretical, v_empirical, atol=1e-3))


class TestCheckSrm(TestCase):
    def test_no_srm_with_equal_split(self):
        p = check_srm(users=[500, 500], weights=[0.5, 0.5])
        self.assertAlmostEqual(p, 1.0, places=5)

    def test_srm_detected_with_uneven_split(self):
        p = check_srm(users=[900, 100], weights=[0.5, 0.5])
        self.assertLess(p, 1e-10)

    def test_zero_weight_variant_excluded(self):
        users_with_zero = [500, 500, 0]
        weights_with_zero = [0.5, 0.5, 0.0]
        p_with_zero = check_srm(users=users_with_zero, weights=weights_with_zero)

        users_valid = [500, 500]
        weights_valid = [0.5, 0.5]
        p_valid = check_srm(users=users_valid, weights=weights_valid)

        self.assertAlmostEqual(p_with_zero, p_valid, places=10)

    def test_negative_weight_variant_excluded(self):
        users = [500, 500, 0]
        weights = [0.5, 0.5, -0.1]
        p = check_srm(users=users, weights=weights)

        total_observed = 1000
        total_weight = 0.9
        x = 0
        for i in range(2):
            e = weights[i] / total_weight * total_observed
            x += (users[i] - e) ** 2 / e
        expected_p = float(chi2.sf(x, 1))

        self.assertAlmostEqual(p, expected_p, places=10)

    def test_multiple_zero_weight_variants(self):
        users = [300, 300, 300, 0, 0]
        weights = [1.0 / 3, 1.0 / 3, 1.0 / 3, 0.0, 0.0]
        p = check_srm(users=users, weights=weights)

        users_valid = [300, 300, 300]
        weights_valid = [1.0 / 3, 1.0 / 3, 1.0 / 3]
        p_valid = check_srm(users=users_valid, weights=weights_valid)

        self.assertAlmostEqual(p, p_valid, places=10)

    def test_all_zero_weights_returns_one(self):
        p = check_srm(users=[100, 200, 300], weights=[0.0, 0.0, 0.0])
        self.assertEqual(p, 1)

    def test_single_valid_weight_returns_one(self):
        p = check_srm(users=[100, 200], weights=[1.0, 0.0])
        self.assertEqual(p, 1)

    def test_zero_total_observed_returns_one(self):
        p = check_srm(users=[0, 0, 0], weights=[0.5, 0.3, 0.2])
        self.assertEqual(p, 1)

    def test_srm_with_zero_weight_and_uneven_split(self):
        users = [900, 100, 50]
        weights = [0.5, 0.5, 0.0]
        p = check_srm(users=users, weights=weights)

        x = 0
        total_observed = 1000
        total_weight = 1.0
        for i in range(2):
            e = weights[i] / total_weight * total_observed
            x += (users[i] - e) ** 2 / e
        expected_p = float(chi2.sf(x, 1))

        self.assertAlmostEqual(p, expected_p, places=10)

    def test_degrees_of_freedom_with_zero_weights(self):
        users = [200, 300, 500, 0]
        weights = [0.2, 0.3, 0.5, 0.0]
        p = check_srm(users=users, weights=weights)

        users_valid = [200, 300, 500]
        weights_valid = [0.2, 0.3, 0.5]
        p_valid = check_srm(users=users_valid, weights=weights_valid)

        self.assertAlmostEqual(p, p_valid, places=10)
        self.assertGreater(p, 0.05)
