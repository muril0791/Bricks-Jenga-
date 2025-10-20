const dict = {
  en: {
    waiting: "Waiting",
    choose: "Choose a brick",
    busted: "Collapsed! You lost this round.",
    success: "Nice pull! Multiplier increased.",
    cashed: "Cashed out!",
  },
  "pt-BR": {
    waiting: "Aguardando",
    choose: "Escolha um bloco",
    busted: "Caiu! Você perdeu esta rodada.",
    success: "Boa! Multiplicador aumentou.",
    cashed: "Retirado!",
  },
  "fr-CA": {
    waiting: "En attente",
    choose: "Choisissez un bloc",
    busted: "Effondré! Manche perdue.",
    success: "Bien joué! Multiplicateur augmenté.",
    cashed: "Encaissement!",
  }
};

export function t(lang, key) {
  const d = dict[lang] || dict.en;
  return d[key] ?? dict.en[key] ?? key;
}

export function money(amount, currency, lang) {
  let locale = "en-US";
  if (currency === "CAD") locale = (lang === "fr-CA") ? "fr-CA" : "en-CA";
  if (currency === "USD") locale = (lang === "pt-BR") ? "en-US" : "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
