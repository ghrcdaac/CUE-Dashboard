// src/utils/toastSetup.js
// Error toasts stay on screen until the user closes them (WCAG 2.2.1 Timing Adjustable):
// an error that disappears after a few seconds may never be read. Other toasts keep
// the default timer and pause while hovered or focused.
import { toast } from 'react-toastify';

const originalError = toast.error;

if (!originalError.__keepsOpen) {
    const errorThatStays = (content, options) => originalError(content, { autoClose: false, ...options });
    errorThatStays.__keepsOpen = true;
    toast.error = errorThatStays;
}
