function Cord({ deleteCord, id, x1, y1, x2, y2 }) {
    const handleClick = () => {
        deleteCord(id);
    };

    return <line x1={x1} y1={y1} x2={x2} y2={y2} onClick={handleClick}></line>;
}

export default Cord;
