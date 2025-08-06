export interface NewsItem {
  imageUrl?: string;
  date?: string;
  month?: string;
  title?: string;
  author?: string;
  link: string;
  isBlogLink?: boolean;
}

export const newsItems: NewsItem[] = [
  {
    imageUrl: "/blog/post-prev-2.jpg",
    date: "03",
    month: "March",
    title: "Parents concerned over 'homeless camp' near school",
    author: "Miya Chahal BBC News, Nottingham",
    link: "https://www.bbc.co.uk/news/articles/cjd3emx2jrpo",
  },
  {
    imageUrl: "/blog/post-prev-1.jpg",
    date: "27",
    month: "Feb",
    title: "Rough Sleeping Snapshot",
    author: "Official Gov Statistics",
    link: "https://www.gov.uk/government/statistics/rough-sleeping-snapshot-in-england-autumn-2024",
  },
  {
    imageUrl: "/blog/post-prev-3.jpg",
    date: "20",
    month: "Dec",
    title: "Furniture recycling scheme",
    author: "Birmingham City Council",
    link: "https://www.birmingham.gov.uk/news/article/1520/furniture_recycling_scheme_helps_people_facing_homelessness_in_birmingham",
  },
  {
    imageUrl: "/blog/blog-link-height_001.png",
    date: "",
    month: "",
    title: "",
    author: "",
    link: "#",
    isBlogLink: true
  }
];
