import type { ImageMetadata } from "astro";
import coastalImage from "@/assets/images/coastal-banner.webp";
import orionImage from "@/assets/images/banners/orion.webp";
import apolloImage from "@/assets/images/banners/apollo.webp";
import minervaImage from "@/assets/images/banners/minerva.webp";
import harbourImage from "@/assets/images/banners/harbour.webp";
import lastSupperImage from "@/assets/images/banners/last-supper.webp";
import diogenesImage from "@/assets/images/banners/diogenes.webp";
import sirensImage from "@/assets/images/banners/ulysses-and-the-sirens.webp";
import polyphemusImage from "@/assets/images/banners/ulysses-and-polyphemus.webp";
import nausicaaImage from "@/assets/images/banners/odysseus-and-nausicaa.webp";
import patroclusImage from "@/assets/images/banners/funeral-of-patroclus.webp";

export interface BannerImage {
  src: ImageMetadata;
  alt: string;
  caption: string;
  captionSourceHref?: string;
  captionSourceLabel?: string;
  thumbhash: string;
  position: string;
}

// Each page chooses a key with <ContentLayout banner="orion">.
// Focal points also apply to the placeholder so it matches the final image.
export const bannerImages = {
  coastal: {
    src: coastalImage,
    alt: "Pale rocks and low green shrubs surround a still blue coastal inlet beneath a soft grey sky",
    caption: "A quiet coastal inlet. Loose strokes of pale blue, pink and green catch the light on the water, weathered rocks and low shoreline vegetation. The painting’s title and artist have not yet been identified.",
    thumbhash: "2fe8090a828a78767f779877e590f2df75",
    position: "50% 50%",
  },
  orion: {
    src: orionImage,
    alt: "The giant Orion reaches towards a wooded mountain landscape, carrying a small guide on his shoulders beneath dark clouds",
    caption: "Blind Orion Searching for the Rising Sun, Nicolas Poussin, 1658. The blinded hunter carries Cedalion on his shoulders to guide him towards the rising sun, whose light will restore his sight. This detail keeps their searching gestures against the vast, cloud-filled landscape.",
    captionSourceHref: "https://www.metmuseum.org/art/collection/search/437326",
    captionSourceLabel: "The Metropolitan Museum of Art",
    thumbhash: "54080a0a82106a7689875898f8e01e0f9b",
    position: "92% 0%",
  },
  apollo: {
    src: apolloImage,
    alt: "Apollo raises an open hand among pink clouds, his golden cloak billowing across a pale blue sky",
    caption: "Apollo, Giovanni Antonio Pellegrini, 1718. Painted for the ceiling of the Mauritshuis’s Golden Room, Apollo represents the sun following Aurora as she drives away the night. His raised hand and sweeping golden cloak give this detail its sense of flight.",
    captionSourceHref: "https://tour.mauritshuis.nl/-giovanni-antonio-pellegrini/apollo/en_GB/",
    captionSourceLabel: "Mauritshuis",
    thumbhash: "28290a0a84fba3786ba5988713a084045a",
    position: "40% 75%",
  },
  minerva: {
    src: minervaImage,
    alt: "Minerva, wearing a white-plumed helmet and pale robes, points across a dark battlefield beneath figures reclining on clouds",
    caption: "Combat de Minerve contre Mars (Minerva Fighting Mars), Jacques-Louis David, 1771. David’s early painting stages a contest between the two deities. This detail centres on Minerva’s plumed helmet and commanding gesture; the fallen Mars lies below the crop. The work won second prize in the Academy’s 1771 competition.",
    captionSourceHref: "https://collections.louvre.fr/en/ark:/53355/cl010066103",
    captionSourceLabel: "Musée du Louvre",
    thumbhash: "d9180a1a820c7a96a97768970687273078",
    position: "70% 20%",
  },
  harbour: {
    src: harbourImage,
    alt: "Sailing ships and small rowing boats cross a golden harbour between tall stone columns and crowded palace steps",
    caption: "Seaport with the Embarkation of the Queen of Sheba, Claude Lorrain, 1648. The queen prepares to sail to Jerusalem to visit King Solomon. Claude imagines her departure through a grand classical harbour, where warm sunrise lights the water, waiting ships and figures gathering on the steps.",
    captionSourceHref: "https://www.nationalgallery.org.uk/paintings/claude-seaport-with-the-embarkation-of-the-queen-of-sheba",
    captionSourceLabel: "The National Gallery, London",
    thumbhash: "da08060a804ca2998f6567876a8f94fa3a",
    position: "50% 50%",
  },
  lastSupper: {
    src: lastSupperImage,
    alt: "Jesus sits calmly at the centre of a long table as the twelve apostles lean together and gesture around him",
    caption: "The Last Supper, Leonardo da Vinci, 1495–1498. Jesus announces that one of his disciples will betray him, setting off a wave of startled gestures and questions around the table. This detail preserves all thirteen figures, with Jesus’s stillness at the centre of the apostles’ agitation. The mural is in Santa Maria delle Grazie, Milan.",
    captionSourceHref: "https://cenacolovinciano.org/en/museum/the-works/the-last-supper-leonardo-da-vinci-1452-1519/",
    captionSourceLabel: "Museo del Cenacolo Vinciano",
    thumbhash: "d5280a0a80035758718a9796d079328d09",
    position: "50% 50%",
  },
  diogenes: {
    src: diogenesImage,
    alt: "Diogenes stands beside a boy bending to drink from cupped hands; a discarded bowl rests on the ground by the stream",
    caption: "Landscape with Diogenes (Diogenes Throwing Away His Bowl), Nicolas Poussin, c. 1654–1658. Seeing a boy drink from his cupped hands, the philosopher realises that even his bowl is unnecessary and discards it. This small encounter within a vast landscape becomes a lesson in simplicity: the teacher learns from a child.",
    captionSourceHref: "https://collections.louvre.fr/en/ark:/53355/cl010062514",
    captionSourceLabel: "Musée du Louvre",
    thumbhash: "8d08060a80028b79627ac5674056094877",
    position: "88% 50%",
  },
  sirens: {
    src: sirensImage,
    alt: "Ulysses is bound to his ship’s mast while sirens with women’s heads and dark bird wings crowd around him over blue water",
    caption: "Ulysses and the Sirens, John William Waterhouse, 1891. In Homer’s Odyssey, Ulysses has himself tied to the mast so he can hear the sirens’ irresistible song without following it to his death. His crew block their ears and row on. Waterhouse gives the sirens women’s heads and birds’ bodies, following an ancient Greek vase.",
    captionSourceHref: "https://www.ngv.vic.gov.au/explore/collection/work/4457/",
    captionSourceLabel: "National Gallery of Victoria",
    thumbhash: "8f18020a823c7b74ef8af8584f0de5f631",
    position: "70% 50%",
  },
  polyphemus: {
    src: polyphemusImage,
    alt: "An ornate sailing ship leaves dark cliffs and sea rocks behind as golden sunrise spreads across the water",
    caption: "Ulysses Deriding Polyphemus — Homer’s Odyssey, J. M. W. Turner, 1829. Escaping the Cyclops, Ulysses turns back from his ship to taunt the giant he has blinded. This detail follows the departing ship into a luminous sunrise; Polyphemus himself is above the cropped edge, sprawled across the cliffs in the full painting.",
    captionSourceHref: "https://www.nationalgallery.org.uk/paintings/joseph-mallord-william-turner-ulysses-deriding-polyphemus-homer-s-odyssey",
    captionSourceLabel: "The National Gallery, London",
    thumbhash: "16290a1282726a6a6f977888a27f36ff39",
    position: "50% 50%",
  },
  nausicaa: {
    src: nausicaaImage,
    alt: "Nausicaa in a blue dress stands with her attendants, one carrying fruit, while the bearded Odysseus looks up at her from the right",
    caption: "Odysseus and Nausicaa, Joachim von Sandrart, 17th century. In Homer’s Odyssey, the shipwrecked Odysseus encounters Princess Nausicaa and her attendants, who have come to wash clothes. Their meeting offers the exhausted traveller a welcome after his ordeal at sea. The crop keeps Nausicaa’s gesture and Odysseus’s upturned face together.",
    captionSourceHref: "https://id.rijksmuseum.nl/2006375",
    captionSourceLabel: "Rijksmuseum",
    thumbhash: "8e18020a804324e9038925970b43f32456",
    position: "50% 50%",
  },
  patroclus: {
    src: patroclusImage,
    alt: "Achilles in a red cloak and plumed helmet bends beside Patroclus’s pale body, surrounded by mourners before a towering funeral pyre",
    caption: "The Funeral of Patroclus, Jacques-Louis David, 1778. In this scene from Homer’s Iliad, Achilles mourns Patroclus, his companion killed by Hector. The pale body and Achilles’s red cloak form the centre of a crowded Greek camp, with a great funeral pyre rising behind them. Grief and the cost of war fill the scene.",
    captionSourceHref: "https://onlinecollection.nationalgallery.ie/objects/8188",
    captionSourceLabel: "National Gallery of Ireland",
    thumbhash: "8f28060a82099454987996890a94580469",
    position: "61% 50%",
  },
} satisfies Record<string, BannerImage>;

export type BannerName = keyof typeof bannerImages;
