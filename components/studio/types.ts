export type CardCorners = {
  tl: number;
  tr: number;
  bl: number;
  br: number;
};

export type CardConfig = {
  theme: string;
  accent: string;
  backgroundImage: string;
  backgroundCorners: CardCorners;
  mark: string;
  headlineOne: string;
  headlineTwo: string;
  intro: string;
  badge: string;
  footerNote: string;
};

export type ThemeOption = {
  label: string;
  labelZh: string;
  note: string;
  noteZh: string;
  layout: string;
  dark: boolean;
  swatches: string[];
};

export type SitePayload = {
  mode: "public" | "private";
  allowPublicUploads: boolean;
  defaultUsername: string;
  allowedUsers: string[];
  repoUrl: string;
  storageDriver: "local" | "google-drive";
  card: CardConfig;
  themes: Record<string, ThemeOption>;
};

export type SummaryPayload = {
  login: string;
  profileUrl: string;
  stars: number;
  rank: string;
  score: number;
  percentile: number;
  repositories: number;
  followers: number;
  contributions: number;
  languages: number;
  fetchedAt: string;
  cached: boolean;
  stale: boolean;
  dataTier: "basic" | "full";
};

export type PublicImage = {
  id: string;
  label: string;
  category: string;
  categoryLabel: string;
  width: number;
  height: number;
  bytes: number;
  url: string;
  createdAt: string;
};

export type PublicCategory = {
  slug: string;
  label: string;
  builtIn: boolean;
  sortOrder: number;
  count?: number;
};

export type UploadStatus = {
  active: boolean;
  percent: number;
  label: string;
  detail: string;
  variant: "working" | "success" | "error";
};
