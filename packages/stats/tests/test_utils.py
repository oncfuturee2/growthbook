from dataclasses import asdict
from functools import partial
from unittest import TestCase, main as unittest_main

import numpy as np
from scipy.stats import norm
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


class TestCheckSrm(TestCase):
    def test_srm_no_observed(self):
        self.assertEqual(check_srm([0, 0], [0.5, 0.5]), 1.0)

    def test_srm_no_valid_variants(self):
        self.assertEqual(check_srm([100, 100], [0.0, 0.0]), 1.0)

    def test_srm_single_valid_variant(self):
        self.assertEqual(check_srm([100, 50], [1.0, 0.0]), 1.0)
        self.assertEqual(check_srm([100, 50], [0.0, 1.0]), 1.0)

    def test_srm_normal_case(self):
        # Perfect split
        p_val = check_srm([500, 500], [0.5, 0.5])
        self.assertAlmostEqual(p_val, 1.0, places=5)
        
        # Slightly off split
        p_val2 = check_srm([520, 480], [0.5, 0.5])
        self.assertLess(p_val2, 1.0)
        self.assertGreater(p_val2, 0.05)
        
        # Very off split
        p_val3 = check_srm([600, 400], [0.5, 0.5])
        self.assertLess(p_val3, 0.05)

    def test_srm_with_zero_weights(self):
        # If the first two have weight 0.5, and the third has 0
        # The DOF should be 2 - 1 = 1, not 3 - 1 = 2
        # For a chi-squared with 1 DOF:
        # x = (510-500)^2/500 + (490-500)^2/500 = 100/500 + 100/500 = 0.4
        p_val = check_srm([510, 490, 0], [0.5, 0.5, 0.0])
        from scipy.stats import chi2
        expected_p_val = chi2.sf(0.4, 1)
        self.assertAlmostEqual(p_val, expected_p_val, places=5)
        
        # Verify that it differs from what it would be with 2 DOF
        expected_p_val_wrong = chi2.sf(0.4, 2)
        self.assertNotAlmostEqual(p_val, expected_p_val_wrong, places=5)
