from dataclasses import asdict
from functools import partial
from unittest import TestCase, main as unittest_main

import numpy as np
from scipy.stats import norm
import copy

from gbstats.utils import multinomial_covariance, truncated_normal_mean, check_srm
from scipy.stats import truncnorm, chi2

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
    def test_no_srm_all_valid_weights(self):
        # Test perfect match without SRM
        users = [500, 500]
        weights = [0.5, 0.5]
        p_value = check_srm(users, weights)
        self.assertAlmostEqual(p_value, 1.0)

    def test_srm_detected(self):
        # Test obvious SRM case
        users = [900, 100]
        weights = [0.5, 0.5]
        p_value = check_srm(users, weights)
        self.assertLess(p_value, 0.01)  # Should detect SRM

    def test_with_zero_weights(self):
        # Test with one weight zero (should treat as 1 effective variant)
        users = [500, 300]
        weights = [1.0, 0.0]  # Only first variant is valid
        p_value = check_srm(users, weights)
        # With 1 effective variant, df=0. chi2.sf(x, 0) is 1 if x=0, else 0
        # But with one variant, there's no variance to check, so p should be 1
        self.assertAlmostEqual(p_value, 1.0)

    def test_with_mixed_weights(self):
        # Test with some valid and some invalid weights
        users = [300, 300, 400, 0]
        weights = [0.3, 0.3, 0.4, 0.0]  # Last weight is zero
        # Test with perfect match
        p_value1 = check_srm(users, weights)
        self.assertAlmostEqual(p_value1, 1.0)

        # Test with mismatch
        users_mismatch = [500, 200, 300, 0]
        p_value2 = check_srm(users_mismatch, weights)
        self.assertLess(p_value2, 0.01)

    def test_degrees_of_freedom_calculation(self):
        # Test that degrees of freedom are calculated correctly
        # For 3 effective variants, df should be 2
        users = [250, 250, 500, 0]
        weights = [0.25, 0.25, 0.5, 0.0]
        # Let's compute the chi2 value manually
        total_observed = sum(users)
        total_weight = sum(weights[:3])  # Only first 3 are valid
        x = 0.0
        for i in range(3):
            e = weights[i] / total_weight * total_observed
            x += ((users[i] - e) ** 2) / e
        # Expected p-value with df=2 should match check_srm's result
        expected_p = chi2.sf(x, 2)
        actual_p = check_srm(users, weights)
        self.assertAlmostEqual(actual_p, expected_p)

    def test_total_observed_zero(self):
        # Test when total observed users is zero
        users = [0, 0, 0]
        weights = [0.3, 0.3, 0.4]
        p_value = check_srm(users, weights)
        self.assertEqual(p_value, 1.0)

    def test_with_negative_weights(self):
        # Test with negative weights (should be treated as invalid)
        users = [500, 400, 100]
        weights = [0.5, 0.5, -0.1]  # Last weight negative
        # Should treat as 2 effective variants
        p_value = check_srm(users, weights)
        # With 2 effective variants, df=1
        total_observed = sum(users[:2])
        total_weight = sum(weights[:2])
        x = 0.0
        for i in range(2):
            e = weights[i] / total_weight * total_observed
            x += ((users[i] - e) ** 2) / e
        expected_p = chi2.sf(x, 1)
        self.assertAlmostEqual(p_value, expected_p)
