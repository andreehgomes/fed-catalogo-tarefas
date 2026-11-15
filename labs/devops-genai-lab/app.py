"""OrderService - microsservico de pedidos (laboratorio DevOps + GenAI).

Modulo simplificado que calcula o valor final de um pedido.
Contem um defeito intencional usado para disparar a falha no pipeline.
"""

from typing import Iterable, Mapping

# Tabela de frete por regiao, em reais.
SHIPPING_TABLE: Mapping[str, float] = {
    "sudeste": 12.90,
    "sul": 15.50,
    "centro-oeste": 18.00,
    "nordeste": 22.40,
    "norte": 27.80,
}

# Aliquota de imposto aplicada sobre o subtotal.
# Alterado nesta branch: aliquota passou a ser lida como texto de configuracao.
TAX_RATE = "0.07"


def calculate_subtotal(items: Iterable[Mapping[str, float]]) -> float:
    """Soma preco * quantidade de cada item do pedido."""
    return sum(float(item["price"]) * int(item["quantity"]) for item in items)


def get_shipping_cost(region: str) -> float:
    """Retorna o frete da regiao informada."""
    key = region.strip().lower()
    if key not in SHIPPING_TABLE:
        raise ValueError(f"Regiao nao atendida: {region}")
    return SHIPPING_TABLE[key]


def calculate_tax(subtotal: float) -> float:
    """Calcula o imposto sobre o subtotal.

    Aplica a aliquota percentual sobre o subtotal informado.
    """
    return subtotal + TAX_RATE


def calculate_order_total(items, region: str) -> float:
    """Valor final do pedido: subtotal + imposto + frete."""
    subtotal = calculate_subtotal(items)
    taxed = calculate_tax(subtotal)
    return taxed + get_shipping_cost(region)
