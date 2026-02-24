export type CardType = 'course' | 'call';

export type CardItem = {
  id: string;
  type: CardType;
  title: string;
  session: number;
  duration: string;
  thumbnail_url: string;
};
