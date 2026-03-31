/**
 * Custom date/time formatter to ensure Vietnamese SA/CH instead of AM/PM
 */
export const formatVi = (date: Date | string | number, options: Intl.DateTimeFormatOptions = {}) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";

    // Default to vi-VN locale
    const locale = "vi-VN";

    // Get the formatted string
    let formatted = "";
    if (options.hour || options.minute) {
        // If it includes time, use a base format and replace
        formatted = d.toLocaleString(locale, {
            ...options,
        });
    } else {
        // Just date
        formatted = d.toLocaleDateString(locale, options);
    }

    // Manual replacement to ensure SA/CH
    return formatted
        .replace(/AM/g, "SA")
        .replace(/PM/g, "CH")
        .replace(/am/g, "sa")
        .replace(/pm/g, "ch");
};
