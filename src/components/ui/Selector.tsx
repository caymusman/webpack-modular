import { MouseEvent, KeyboardEvent, useState } from 'react';

interface SelectorProps {
    id: string;
    values: string[];
    handleClick: (val: string) => void;
}

function Selector({ id, values, handleClick }: SelectorProps) {
    const [val, setVal] = useState(values[0]);

    const onClick = (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
        const text = (event.target as HTMLDivElement).innerHTML;
        setVal(text);
        handleClick(text);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick(event);
        }
    };

    return (
        <div id={id} className="selectorDiv" role="listbox" aria-label={id}>
            <span role="option" aria-selected="true">
                {val}
            </span>
            <div id="selectorContent">
                {values.map((el) => {
                    return (
                        <div
                            key={el}
                            className="selectorVal"
                            role="option"
                            tabIndex={0}
                            onClick={onClick}
                            onKeyDown={handleKeyDown}
                        >
                            {el}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Selector;
