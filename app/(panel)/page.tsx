import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export default function PanelPage() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Panel</h1>
        <CardDescription className="text-base text-foreground/80">
          El espacio de trabajo está vacío.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Todavía no hay información que mostrar.</p>
      </CardContent>
    </Card>
  );
}
