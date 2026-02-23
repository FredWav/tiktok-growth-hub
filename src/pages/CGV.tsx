import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";

export default function CGV() {
  return (
    <Layout>
      <Section variant="default" size="lg">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8">Conditions Générales de Vente</h1>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Objet</h2>
          <p className="text-muted-foreground mb-4">
            Les présentes CGV régissent les ventes de prestations de conseil et d'accompagnement en stratégie TikTok proposées par Fred Wav.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Offres et tarifs</h2>
          <p className="text-muted-foreground mb-4">
            Les offres disponibles sont : One Shot (179 EUR), 45 Jours (sur candidature) et VIP (à partir de 99 EUR/mois). Les tarifs sont indiqués TTC et peuvent être modifiés à tout moment. Le tarif applicable est celui en vigueur au moment de la commande.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Paiement</h2>
          <p className="text-muted-foreground mb-4">
            Le paiement s'effectue en ligne via Stripe. Moyens acceptés : carte bancaire, Klarna (3x) et PayPal (4x), sous réserve d'acceptation. Le paiement est exigible à la commande.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Droit de rétractation</h2>
          <p className="text-muted-foreground mb-4">
            Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux prestations de services pleinement exécutées avant la fin du délai de rétractation et dont l'exécution a commencé avec l'accord du consommateur. Pour les prestations non encore exécutées, un délai de rétractation de 14 jours s'applique à compter de la date de commande.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Exécution des prestations</h2>
          <p className="text-muted-foreground mb-4">
            Les sessions sont réalisées en visioconférence. Les dates sont convenues entre les parties après paiement. Fred Wav s'engage à fournir les prestations avec diligence et professionnalisme.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Responsabilité</h2>
          <p className="text-muted-foreground mb-4">
            Fred Wav fournit des conseils et recommandations. Les résultats dépendent de la mise en œuvre par le client. Aucune garantie de résultats spécifiques n'est donnée.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8 mb-3">Litiges</h2>
          <p className="text-muted-foreground mb-4">
            En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux compétents seront ceux du lieu de résidence du vendeur.
          </p>

          <p className="text-sm text-muted-foreground mt-12">Dernière mise à jour : février 2026</p>
        </div>
      </Section>
    </Layout>
  );
}
