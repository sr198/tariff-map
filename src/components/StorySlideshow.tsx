import React from 'react';

const StorySlideshow: React.FC = () => {
  const strips = [
    { id: 1, src: '/tariff/strip-1.png', alt: 'Comic Strip 1', number: '1' },
    { id: 2, src: '/tariff/strip-2.png', alt: 'Comic Strip 2', number: '2' },
    { id: 3, src: '/tariff/strip-3.png', alt: 'Comic Strip 3', number: '3' },
    { id: 4, src: '/tariff/strip-4.png', alt: 'Comic Strip 4', number: '4' },
    { id: 5, src: '/tariff/strip-5.png', alt: 'Comic Strip 5', number: '5' },
    { id: 6, src: '/tariff/strip-6.png', alt: 'Comic Strip 6', number: '6' },
    { id: 7, src: '/tariff/strip-7.png', alt: 'Comic Strip 7', number: '7' },
    { id: 8, src: '/tariff/strip-8.png', alt: 'Comic Strip 8', number: '8' },
    { id: 9, src: '/tariff/strip-9.png', alt: 'Comic Strip 9', number: '9' },
    { id: 10, src: '/tariff/strip-A.png', alt: 'Comic Strip 10', number: '10' },
    { id: 11, src: '/tariff/strip-B.png', alt: 'Comic Strip 11', number: '11' },
    { id: 12, src: '/tariff/strip-C.png', alt: 'Comic Strip 12', number: '12' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Wait, how does tariff work again?</h2>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4">
            {strips.map((strip) => (
              <div key={strip.id} className="relative flex-none first:ml-0">
                <div className="relative">
                  <img
                    src={strip.src}
                    alt={strip.alt}
                    className="
                      rounded-lg
                      shadow-sm
                      object-contain
                      h-[400px]
                      w-auto
                      border border-gray-200
                    "
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorySlideshow; 