export const mapUrl = "https://maps.app.goo.gl/FHLKC7UydaLqFPM99";
export const addresses = [
  "Azadlıq prospekti, 39D, Bakı",
  "Dilarə Əliyeva küçəsi, 21, Bakı",
  "Azadlıq prospekti, 39E, Bakı",
];
export const branches = addresses.map((address, i) => ({
  name: ["39D", "21", "39E"][i],
  address,
  phone: "",
  hours: "",
  map_url: "",
}));

// Resolved from the owner-supplied share link, 9 November 2026. One store pin only.
export const mapEmbedUrl = "https://www.google.com/maps?q=40.3775119,49.8481256&z=17&output=embed";
