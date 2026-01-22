import React from 'react';
import { motion } from 'framer-motion';

const categories = [
    "All",
    "Electronics",
    "Furniture",
    "Clothing",
    "Vehicles",
    "Books",
    "Services",
    "Other"
];

export default function CategoryPills({ selected, onSelect }) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-4 pt-2 scrollbar-hide mask-fade">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onSelect(category)}
                    className={`relative px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ring-2 ring-transparent focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-800 ${selected === category
                        ? 'text-white bg-gray-900 dark:bg-blue-600 shadow-lg shadow-gray-900/20 dark:shadow-blue-900/40 scale-105'
                        : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}

                >
                    {category}
                    {selected === category && (
                        <motion.div
                            layoutId="activePill"
                            className="absolute inset-0 rounded-full bg-white/10"
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
