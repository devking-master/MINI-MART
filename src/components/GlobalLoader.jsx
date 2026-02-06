import React from 'react';
import { MultiStepLoader } from './animations/Loader';

const loadingStates = [
    { text: "Initializing Mini Mart..." },
    { text: "Securing Connection..." },
    { text: "Fetching Market Inventory..." },
    { text: "Optimizing Your Experience..." },
    { text: "Almost there..." }
];

export default function GlobalLoader({ loading }) {
    return (
        <div className="fixed inset-0 z-[999] bg-[#050505] flex items-center justify-center">
            <MultiStepLoader
                loadingStates={loadingStates}
                loading={loading}
                duration={600}
                loop={true}
            />
        </div>
    );
}
