import { OrderStatus } from '@/core/entities/Order';

const DEFAULT_LANG = 'fr-FR';

export function getSpeechLangFromLocale(locale: string): string {
  if (locale === 'en') return 'en-US';
  if (locale === 'lb' || locale === 'ar') return 'ar';
  if (locale === 'zh') return 'zh-CN';
  return DEFAULT_LANG;
}

export function speakText(message: string, lang?: string) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = lang || DEFAULT_LANG;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore TTS errors
  }
}

export function speakNewOrder(lang?: string) {
  speakText('Vous avez reçu une nouvelle commande !', lang);
}

export function speakOrderStatus(
  status: OrderStatus,
  tableLabel: string,
  lang?: string
) {
  let phrase: string;
  switch (status) {
    case OrderStatus.PAID:
      phrase = `La commande pour la table ${tableLabel} a été payée.`;
      break;
    case OrderStatus.PREPARING:
      phrase = `La commande pour la table ${tableLabel} est en préparation.`;
      break;
    case OrderStatus.READY:
      phrase = `La commande pour la table ${tableLabel} est prête.`;
      break;
    case OrderStatus.DELIVERED:
      phrase = `La commande pour la table ${tableLabel} a été servie.`;
      break;
    case OrderStatus.CANCELLED:
      phrase = `La commande pour la table ${tableLabel} a été annulée.`;
      break;
    default:
      phrase = `Le statut de la commande pour la table ${tableLabel} a changé.`;
  }
  speakText(phrase, lang);
}

