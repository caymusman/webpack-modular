interface MyButtonProps {
    name: string;
    handleClick: (type: string, inputOnly: boolean) => void;
    inputOnly: boolean;
    audioIn?: boolean;
}

function MyButton({ name, handleClick, inputOnly, audioIn }: MyButtonProps) {
    const onClick = () => {
        handleClick(name, inputOnly);
    };

    return (
        <button className="addBtn" onClick={onClick} disabled={audioIn}>
            {name}
        </button>
    );
}

export default MyButton;
