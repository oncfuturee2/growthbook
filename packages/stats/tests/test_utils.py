from unittest import TestCase, main as unittest_main

from scipy.stats.distributions import chi2  # type: ignore

from gbstats.utils import check_srm


class TestCheckSrm(TestCase):
    def test_check_srm_uses_only_positive_weight_variations(self):
        users = [1000, 1200, 900]
        weights = [0.5, 0.5, 0]

        expected_x = ((1000 - 1100) ** 2) / 1100 + ((1200 - 1100) ** 2) / 1100

        self.assertAlmostEqual(check_srm(users, weights), chi2.sf(expected_x, 1))
        self.assertAlmostEqual(
            check_srm(users, weights), check_srm([1000, 1200], [0.5, 0.5])
        )

    def test_check_srm_returns_one_when_fewer_than_two_positive_weights(self):
        self.assertEqual(check_srm([1000, 900, 800], [1, 0, 0]), 1)


if __name__ == "__main__":
    unittest_main()
