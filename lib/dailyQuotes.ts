export type DailyQuote = {
  headline: string;
  subtitle: string;
  image: string;
};

export const DAILY_QUOTES: DailyQuote[] = [
  { headline: "YOU DID GREAT TODAY! ❤️", subtitle: "Terima kasih jadi sebahagian daripada Tenderista.", image: "/brand/mascots/mascot-01.png" },
  { headline: "LET'S MAKE TODAY COUNT! ✨", subtitle: "Buat yang terbaik, selebihnya kita serahkan pada Allah.", image: "/brand/mascots/mascot-02.png" },
  { headline: "ONE TEAM, ONE GOAL. 🤝", subtitle: "Kita mungkin berbeza tugas, tapi kita bergerak bersama.", image: "/brand/mascots/mascot-03.png" },
  { headline: "SMALL STEPS MATTER. 🌱", subtitle: "Sedikit demi sedikit, kita sedang bina sesuatu yang besar.", image: "/brand/mascots/mascot-04.png" },
  { headline: "REZEKI HARI INI, ALHAMDULILLAH. 🤍", subtitle: "Syukuri yang ada, usaha untuk yang seterusnya.", image: "/brand/mascots/mascot-05.png" },
  { headline: "YOUR EFFORT MATTERS. ⭐", subtitle: "Setiap usaha kecil anda menyumbang kepada Tenderista.", image: "/brand/mascots/mascot-06.png" },
  { headline: "A SMILE GOES A LONG WAY. 😊", subtitle: "Layan pelanggan seperti kita sendiri mahu dilayan.", image: "/brand/mascots/mascot-07.png" },
  { headline: "KEEP IT CLEAN, KEEP IT PROUD. ✨", subtitle: "Kedai yang bersih mencerminkan kerja yang kita banggakan.", image: "/brand/mascots/mascot-08.png" },
  { headline: "WE'VE GOT THIS! 🔥", subtitle: "Bila kita saling membantu, semuanya jadi lebih mudah.", image: "/brand/mascots/mascot-09.png" },
  { headline: "DO IT WITH HEART. ❤️", subtitle: "Bukan sekadar siapkan kerja — buat dengan rasa peduli.", image: "/brand/mascots/mascot-10.png" },
  { headline: "GOOD ENERGY TODAY! ⚡", subtitle: "Datang dengan semangat, balik dengan rasa puas.", image: "/brand/mascots/mascot-11.png" },
  { headline: "BUSY DAY? WE CAN DO THIS. 💪", subtitle: "Satu order, satu tugas, satu langkah pada satu masa.", image: "/brand/mascots/mascot-12.png" },
  { headline: "QUALITY FIRST. ⭐", subtitle: "Setiap hidangan membawa nama Tenderista.", image: "/brand/mascots/mascot-13.png" },
  { headline: "HALFWAY THERE! 🎉", subtitle: "Teruskan momentum. Anda sedang buat yang terbaik.", image: "/brand/mascots/mascot-14.png" },
  { headline: "REST. RESET. COME BACK STRONGER. 🤍", subtitle: "Kerja penting, diri sendiri pun penting.", image: "/brand/mascots/mascot-15.png" },
  { headline: "THANK YOU FOR SHOWING UP. ❤️", subtitle: "Kehadiran dan usaha anda hari ini sangat dihargai.", image: "/brand/mascots/mascot-16.png" },
  { headline: "MAKE SOMEONE'S DAY. ☀️", subtitle: "Servis yang baik mungkin perkara kecil bagi kita, besar bagi pelanggan.", image: "/brand/mascots/mascot-17.png" },
  { headline: "MISTAKES = LESSONS. 🌱", subtitle: "Betulkan, belajar dan teruskan. Kita semua sedang berkembang.", image: "/brand/mascots/mascot-18.png" },
  { headline: "TEAMWORK MAKES IT LIGHTER. 🤝", subtitle: "Jangan biarkan kawan struggle seorang diri.", image: "/brand/mascots/mascot-19.png" },
  { headline: "BISMILLAH, LET'S GO! ✨", subtitle: "Mulakan dengan niat yang baik dan berikan yang terbaik.", image: "/brand/mascots/mascot-20.png" },
  { headline: "EVERY CUSTOMER MATTERS. ❤️", subtitle: "Satu pengalaman yang baik boleh buat mereka datang semula.", image: "/brand/mascots/mascot-21.png" },
  { headline: "PROGRESS, NOT PERFECTION. 🌟", subtitle: "Hari ini lebih baik sedikit daripada semalam pun dah cukup bermakna.", image: "/brand/mascots/mascot-22.png" },
  { headline: "KEEP THE STANDARD HIGH. 👑", subtitle: "Walaupun sibuk, kualiti tetap nombor satu.", image: "/brand/mascots/mascot-23.png" },
  { headline: "YOU'RE PART OF THE STORY. ❤️", subtitle: "Tenderista berkembang kerana orang-orang yang menjaganya setiap hari.", image: "/brand/mascots/mascot-24.png" },
  { headline: "GOOD WORK DESERVES A SMILE. 😊", subtitle: "Tengok balik apa yang dah berjaya kita siapkan hari ini.", image: "/brand/mascots/mascot-25.png" },
  { headline: "ALMOST THERE! 🔥", subtitle: "Sedikit lagi. Jangan hilang momentum sekarang.", image: "/brand/mascots/mascot-26.png" },
  { headline: "SPREAD KINDNESS TODAY. 🤍", subtitle: "Cakap baik, bantu kawan dan mudahkan urusan orang lain.", image: "/brand/mascots/mascot-27.png" },
  { headline: "PROUD OF THIS TEAM. 🏆", subtitle: "Setiap orang ada peranan. Setiap peranan ada nilainya.", image: "/brand/mascots/mascot-28.png" },
  { headline: "LOOK HOW FAR WE'VE COME. ✨", subtitle: "Jangan hanya tengok apa yang belum siap. Hargai juga apa yang dah dicapai.", image: "/brand/mascots/mascot-29.png" },
  { headline: "WE DID IT! 🎉❤️", subtitle: "Terima kasih untuk usaha, masa dan hati yang anda beri kepada Tenderista.", image: "/brand/mascots/mascot-30.png" },
];

/** Picks today's quote based on day-of-month in the branch's local timezone
 *  (1st -> index 0, ..., 30th -> index 29, 31st wraps back to index 0). */
export function getTodaysQuote(branchLocalDateStr: string): DailyQuote {
  const dayOfMonth = Number(branchLocalDateStr.slice(8, 10));
  const index = (dayOfMonth - 1) % DAILY_QUOTES.length;
  return DAILY_QUOTES[index];
}
