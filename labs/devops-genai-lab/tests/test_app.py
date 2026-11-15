"""Testes unitarios do OrderService."""

import pytest

from app import (
    calculate_order_total,
    calculate_subtotal,
    calculate_tax,
    get_shipping_cost,
)

ITEMS = [
    {"price": 100.00, "quantity": 2},
    {"price": 49.90, "quantity": 1},
]


def test_calculate_subtotal_soma_precos_por_quantidade():
    assert calculate_subtotal(ITEMS) == pytest.approx(249.90)


def test_get_shipping_cost_regiao_conhecida():
    assert get_shipping_cost("Sudeste") == pytest.approx(12.90)


def test_get_shipping_cost_regiao_invalida():
    with pytest.raises(ValueError):
        get_shipping_cost("antartida")


def test_calculate_tax_aplica_aliquota_sobre_subtotal():
    # 100.00 + 7% = 107.00
    assert calculate_tax(100.00) == pytest.approx(107.00)


def test_calculate_order_total_sudeste():
    # subtotal 249.90 + imposto 7% (17.493) + frete 12.90 = 280.293
    assert calculate_order_total(ITEMS, "sudeste") == pytest.approx(280.293)
