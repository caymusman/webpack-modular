import { memo, useEffect, useState } from 'react';

interface AlertBoxProps {
    message: string;
    onDismiss: () => void;
}

function AlertBox({ message, onDismiss }: AlertBoxProps) {
    const [visible, setVisible] = useState(false);
    const [displayMessage, setDisplayMessage] = useState('');

    useEffect(() => {
        if (message !== '') {
            setDisplayMessage(message);
            // Trigger enter animation on next frame
            requestAnimationFrame(() => setVisible(true));
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onDismiss, 300);
            }, 4000);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [message, onDismiss]);

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
