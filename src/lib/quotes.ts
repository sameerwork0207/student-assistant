export interface Quote {
  text: string;
  author: string;
}

export const quotes: Quote[] = [
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Your mind is for having ideas, not holding them.", author: "David Allen" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Deep work is the superpower of the 21st century.", author: "Cal Newport" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Work gives you meaning and purpose and life is empty without it.", author: "Stephen Hawking" },
  { text: "Tomorrow is the only day in the year that appeals to a lazy man.", author: "Jimmy Lyons" },
  { text: "Until we can manage time, we can manage nothing else.", author: "Peter Drucker" },
  { text: "The best way to predict the future is to create it.", author: "Abraham Lincoln" }
];

export function getDailyQuote(): Quote {
  const today = new Date();
  // Calculate a consistent day index
  const dayIndex = (today.getFullYear() * 365 + (today.getMonth() + 1) * 31 + today.getDate()) % quotes.length;
  return quotes[dayIndex];
}
