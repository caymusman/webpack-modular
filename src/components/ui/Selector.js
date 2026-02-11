import { useState } from 'react';

function Selector({ id, values, handleClick }) {
    const [val, setVal] = useState(values[0]);

    const onClick = (event) => {
        setVal(event.target.innerHTML);
        handleClick(event.target.innerHTML);
    };

    return (
        <div id={id} className="selectorDiv">
            <span>{val}</span>
            <div id="selectorContent">
                {values.map((el) => {
                    return (
                        <div key={el} className="selectorVal" onClick={onClick}>
                            {el}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Selector;
