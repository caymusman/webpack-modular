import { useState } from 'react';

function Selector({ id, values, handleClick }) {
    const [val, setVal] = useState(values[0]);

    const onClick = (event) => {
        setVal(event.target.innerHTML);
        handleClick(event.target.innerHTML);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick(event);
        }
    };

    return (
        <div id={id} className="selectorDiv" role="listbox" aria-label={id}>
            <span role="option" aria-selected="true">{val}</span>
            <div id="selectorContent">
                {values.map((el) => {
                    return (
                        <div key={el} className="selectorVal" role="option" tabIndex={0} onClick={onClick} onKeyDown={handleKeyDown}>
                            {el}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Selector;
