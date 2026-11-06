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
