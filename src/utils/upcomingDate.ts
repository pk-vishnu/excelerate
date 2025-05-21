function isUpcomingEvent(dateStr: string | null): boolean {
    if (dateStr === null) {
        return false;
    }
    try {
        // Parse the record date
        const recordDate = new Date(dateStr);

        // Get today's date (without time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate date 2 days from now
        const twoDaysLater = new Date(today);
        twoDaysLater.setDate(today.getDate() + 3);

        // Check if the record date is between today and 2 days later
        return recordDate >= today && recordDate <= twoDaysLater;
    } catch (error) {
        console.error("Error parsing date:", error);
        return false;
    }
}
export default isUpcomingEvent;