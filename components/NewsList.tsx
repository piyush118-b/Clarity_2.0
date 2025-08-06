import * as React from 'react';
import NewsCard from './NewsCard';
import { newsItems, NewsItem } from '@/data/news';

const NewsList: React.FC = () => {

  
  return (
    <div className="w-full">
      {newsItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No news available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {newsItems.map((item: NewsItem, index: number) => (
            <NewsCard key={index} {...item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsList;
