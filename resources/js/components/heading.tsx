import React from 'react';

interface HeadingProps {
    title?: string;
    description?: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    children?: React.ReactNode;
}

export function Heading({ title, description, level = 2, children }: HeadingProps) {
    const displayTitle = title || children;
    
    const headingClasses = "text-xl font-semibold tracking-tight";
    
    if (level === 1) {
        return (
            <div className="mb-8 space-y-0.5">
                <h1 className={headingClasses}>{displayTitle}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
        );
    }
    
    if (level === 3) {
        return (
            <div className="mb-8 space-y-0.5">
                <h3 className={headingClasses}>{displayTitle}</h3>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
        );
    }
    
    return (
        <div className="mb-8 space-y-0.5">
            <h2 className={headingClasses}>{displayTitle}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
    );
}

export default function HeadingDefault({ title, description }: { title: string; description?: string }) {
    return (
        <div className="mb-8 space-y-0.5">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
    );
}
