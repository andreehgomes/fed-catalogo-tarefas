# Log do job `unit_test` — GitHub Actions

**Run:** #3 (disparado pela abertura do PR #1)
**Job:** `unit_test (stage test)` — falhou em 9s
**Runner:** ubuntu-latest, Python 3.12.16, pytest 8.3.4

```
============================= test session starts ==============================
platform linux -- Python 3.12.16, pytest-8.3.4, pluggy-1.7.0
rootdir: /home/runner/work/fed-catalogo-tarefas/fed-catalogo-tarefas/labs/devops-genai-lab
configfile: pytest.ini
testpaths: tests
collecting ... collected 5 items

tests/test_app.py::test_calculate_subtotal_soma_precos_por_quantidade PASSED [ 20%]
tests/test_app.py::test_get_shipping_cost_regiao_conhecida PASSED        [ 40%]
tests/test_app.py::test_get_shipping_cost_regiao_invalida PASSED         [ 60%]
tests/test_app.py::test_calculate_tax_aplica_aliquota_sobre_subtotal FAILED [ 80%]
tests/test_app.py::test_calculate_order_total_sudeste FAILED             [100%]

=================================== FAILURES ===================================
______________ test_calculate_tax_aplica_aliquota_sobre_subtotal _______________

    def test_calculate_tax_aplica_aliquota_sobre_subtotal():
        # 100.00 + 7% = 107.00
>       assert calculate_tax(100.00) == pytest.approx(107.00)

tests/test_app.py:33:
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

subtotal = 100.0

    def calculate_tax(subtotal: float) -> float:
        """Calcula o imposto sobre o subtotal.

        Aplica a aliquota percentual sobre o subtotal informado.
        """
>       return subtotal + TAX_RATE
E       TypeError: unsupported operand type(s) for +: 'float' and 'str'

app.py:41: TypeError
______________________ test_calculate_order_total_sudeste ______________________

    def test_calculate_order_total_sudeste():
        # subtotal 249.90 + imposto 7% (17.493) + frete 12.90 = 280.293
>       assert calculate_order_total(ITEMS, "sudeste") == pytest.approx(280.293)

tests/test_app.py:38:
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

items = [{'price': 100.0, 'quantity': 2}, {'price': 49.9, 'quantity': 1}]
region = 'sudeste'

    def calculate_order_total(items, region: str) -> float:
        """Valor final do pedido: subtotal + imposto + frete."""
        subtotal = calculate_subtotal(items)
>       taxed = calculate_tax(subtotal)

app.py:47:
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

subtotal = 249.9

>       return subtotal + TAX_RATE
E       TypeError: unsupported operand type(s) for +: 'float' and 'str'

app.py:41: TypeError
=========================== short test summary info ============================
FAILED tests/test_app.py::test_calculate_tax_aplica_aliquota_sobre_subtotal
FAILED tests/test_app.py::test_calculate_order_total_sudeste
========================= 2 failed, 3 passed in 0.03s ==========================
Error: Process completed with exit code 1.
```

## Observação

Três testes passam e dois falham. O módulo importa normalmente — o defeito
só se manifesta no caminho de execução que usa `calculate_tax()`.
