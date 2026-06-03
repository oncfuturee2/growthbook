from dataclasses import asdict
from functools import partial
from unittest import TestCase, main as unittest_main

import numpy as np
from scipy.stats import norm
from scipy.stats import chi2
import copy

from gbstats.utils import multinomial_covariance, truncated_normal_mean, check_srm
from scipy.stats import truncnorm

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


class TestCheckSRM(TestCase):
    def test_no_users(self):
        p = check_srm([0, 0], [0.5, 0.5])
        self.assertEqual(p, 1)

    def test_all_weights_positive(self):
        users = [100, 100]
        weights = [0.5, 0.5]
        p = check_srm(users, weights)
        total = sum(users)
        e0 = weights[0] * total
        e1 = weights[1] * total
        x = (users[0] - e0) ** 2 / e0 + (users[1] - e1) ** 2 / e1
        expected_p = chi2.sf(x, 1)
        self.assertAlmostEqual(p, expected_p)

    def test_three_variants_all_positive(self):
        users = [100, 150, 250]
        weights = [0.2, 0.3, 0.5]
        p = check_srm(users, weights)
        total = sum(users)
        total_weight = sum(weights)
        x = 0
        for u, w in zip(users, weights):
            e = w / total_weight * total
            x += (u - e) ** 2 / e
        expected_p = chi2.sf(x, 2)
        self.assertAlmostEqual(p, expected_p)

    def test_zero_weight_variant_skipped_df_adjusted(self):
        users = [100, 100, 200]
        weights = [0.5, 0.0, 0.5]
        p = check_srm(users, weights)
        total = sum(users)
        total_weight = sum(weights)
        x = 0
        for u, w in zip(users, weights):
            if w <= 0:
                continue
            e = w / total_weight * total
            x += (u - e) ** 2 / e
        expected_p = chi2.sf(x, 1)
        self.assertAlmostEqual(p, expected_p)

    def test_multiple_zero_weights(self):
        users = [100, 50, 200, 0]
        weights = [0.5, 0.0, 0.5, 0.0]
        p = check_srm(users, weights)
        total = sum(users)
        total_weight = sum(weights)
        x = 0
        for u, w in zip(users, weights):
            if w <= 0:
                continue
            e = w / total_weight * total
            x += (u - e) ** 2 / e
        expected_p = chi2.sf(x, 1)
        self.assertAlmostEqual(p, expected_p)

    def test_only_one_valid_variant_returns_1(self):
        users = [100, 50]
        weights = [0.5, 0.0]
        p = check_srm(users, weights)
        self.assertEqual(p, 1)

    def test_all_zero_weights_returns_1(self):
        users = [100, 100]
        weights = [0.0, 0.0]
        p = check_srm(users, weights)
        self.assertEqual(p, 1)

    def test_srm_detected_when_split_is_wrong(self):
        users = [200, 100]
        weights = [0.5, 0.5]
        p = check_srm(users, weights)
        self.assertLess(p, 0.05)

    def test_no_srm_when_split_matches(self):
        users = [500, 500]
        weights = [0.5, 0.5]
        p = check_srm(users, weights)
        self.assertAlmostEqual(p, 1.0)

    def test_zero_weight_with_srm_in_remaining(self):
        users = [200, 50, 100]
        weights = [0.0, 0.5, 0.5]
        p = check_srm(users, weights)
        total = sum(users)
        valid_weights = [w for w in weights if w > 0]
        total_weight = sum(valid_weights)
        x = 0
        for u, w in zip(users, weights):
            if w <= 0:
                continue
            e = w / total_weight * total
            x += (u - e) ** 2 / e
        expected_p = chi2.sf(x, 1)
        self.assertAlmostEqual(p, expected_p)
