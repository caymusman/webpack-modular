import { memo, useEffect, useState } from 'react';

interface AlertBoxProps {
    message: string;
    onDismiss: () => void;
}

function AlertBox({ message, onDismiss }: AlertBoxProps) {
    const visible = message !== '';
    const [displayMessage, setDisplayMessage] = useState('');
    const [prevMessage, setPrevMessage] = useState('');

    if (message !== '' && message !== prevMessage) {
        setPrevMessage(message);
        setDisplayMessage(message);
    }

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(onDismiss, 4000);
            return () => clearTimeout(timer);
        }
    }, [visible, onDismiss]);

    return (
        <div className={`alertBox ${visible ? 'alertBox--visible' : ''}`} role="alert" aria-live="assertive">
            <div className="alertBox__icon">
                <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
            </div>
            <div className="alertBox__body">
                <h3 className="alertBox__title">Not so fast!</h3>
                <p className="alertBox__message">{displayMessage}</p>
            </div>
            <button className="alertBox__close iconBtn" onClick={onDismiss} aria-label="Dismiss alert">
                <i className="fa fa-times-circle" aria-hidden="true"></i>
            </button>
            {visible && <div className="alertBox__timer" />}
        </div>
    );
}

export default memo(AlertBox);
