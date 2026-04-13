interface BannerProps {
  kind: 'error' | 'notice' | 'loading';
  children: string;
}

export const Banner = ({ kind, children }: BannerProps) => {
  const className = kind === 'error' ? 'error-banner' : kind === 'notice' ? 'notice-banner' : 'loader';
  return <div className={className}>{children}</div>;
};
