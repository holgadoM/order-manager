import { OrderStatusControl } from "@/components/orders/order-status-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateOrderStatus } from "@/lib/order-status-actions";
import { orderStatusLabel, orderTotalCents, type OrderDetail } from "@/lib/orders";
import { centsToEuros } from "@/lib/products";

type OrderDetailViewProps = {
  order: OrderDetail;
};

function euros(cents: number): string {
  return `${centsToEuros(cents)} €`;
}

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const totalCents = orderTotalCents(
    order.items.map((item) => ({
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Pedido de {order.customerName}</h1>
        <p className="text-sm text-foreground/80">
          <span className="font-medium text-foreground">{orderStatusLabel(order.status)}</span>
          <span className="text-muted-foreground"> · {order.createdAtLabel}</span>
        </p>
        {order.notes ? <p className="max-w-2xl text-sm text-foreground/80">Nota: {order.notes}</p> : null}
      </header>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>
            <h2 className="font-heading text-lg font-semibold">Líneas</h2>
          </CardTitle>
          <CardDescription className="text-sm text-foreground/80">
            Cantidades y precios guardados en el momento del pedido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Líneas del pedido">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col">Producto</TableHead>
                <TableHead scope="col">Cantidad</TableHead>
                <TableHead scope="col">Precio</TableHead>
                <TableHead scope="col">Importe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.length > 0 ? (
                order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{euros(item.unitPriceCents)}</TableCell>
                    <TableCell>
                      {euros(orderTotalCents([{ quantity: item.quantity, unitPriceCents: item.unitPriceCents }]))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-8 text-center whitespace-normal text-muted-foreground">
                    Este pedido no tiene líneas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="font-medium">
                  Total
                </TableCell>
                <TableCell className="font-medium">{euros(totalCents)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>
            <h2 className="font-heading text-lg font-semibold">Cambiar estado</h2>
          </CardTitle>
          <CardDescription className="text-sm text-foreground/80">
            El estado actual es {orderStatusLabel(order.status).toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderStatusControl orderId={order.id} status={order.status} action={updateOrderStatus} />
        </CardContent>
      </Card>
    </div>
  );
}
