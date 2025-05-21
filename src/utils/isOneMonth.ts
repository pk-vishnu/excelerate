
function isOneMonthOld(dateStr: string | null): boolean {
  if (dateStr === null) {
    return false;
  }
  try {
    const recordDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);

    return recordDate <= oneMonthAgo;

  } catch (error) {
    console.error("Error parsing date:", error);
    return false;
  }
}
export default isOneMonthOld;