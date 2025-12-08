import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Tweet as TweetType } from '@/services/twitter/types';

interface Props {
  tweet: TweetType;
}

const Tweet: React.FC<Props> = ({ tweet }) => {
  const { user, tweet: tweetData, media } = tweet;

  const renderMedia = () => {
    if (!media || media.length === 0) return null;

    return (
      <div className="mt-2 rounded-lg overflow-hidden">
        <div className={`grid gap-1 ${media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {media.map((item) => {
            switch (item.type) {
              case 'photo':
                if (!item.url) return null;
                return (
                  <Image
                    key={item.media_key}
                    src={item.url}
                    alt="Tweet media"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover rounded-lg"
                    style={{ maxHeight: '300px', maxWidth: '300px' }}
                    unoptimized
                  />
                );
              case 'video':
              case 'animated_gif':
                const videoVariant = item.variants?.findLast((v) => v.content_type === 'video/mp4');
                return videoVariant ? (
                  <video
                    key={item.media_key}
                    src={videoVariant.url}
                    controls={item.type === 'video'}
                    autoPlay={item.type === 'animated_gif'}
                    loop={item.type === 'animated_gif'}
                    muted
                    className="w-full h-full object-cover rounded-lg"
                    style={{ maxHeight: '300px', maxWidth: '300px' }}
                  />
                ) : null;
              default:
                return null;
            }
          })}
        </div>
      </div>
    );
  };

  const tweetUrl = `https://twitter.com/${user.username}/status/${tweetData.id}`;

  const profileImage =
    user.profile_image_url ||
    'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex flex-col gap-2 p-2 rounded-md cursor-pointer',
        'border border-transparent transition-all duration-300',
        'hover:border-brand-600 dark:hover:border-brand-600',
      )}
    >
      <div className="flex items-center gap-2 w-full overflow-hidden">
        <Image
          src={profileImage}
          alt={`${user.name}'s profile`}
          width={24}
          height={24}
          className="w-6 h-6 rounded-full object-cover"
          unoptimized
        />
        <p className="text-md font-bold truncate">{user.name}</p>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
      </div>
      <p className="text-sm">{tweetData.text}</p>
      {renderMedia()}
    </a>
  );
};

export default Tweet;
