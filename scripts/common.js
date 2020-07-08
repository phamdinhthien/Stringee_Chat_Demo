class Common {
    static formatDatetime(datetime) {
        let dateTime = new Date(datetime);
        let hour = dateTime.getHours();
        let minute = dateTime.getMinutes();
        let day = dateTime.getDate() > 9 ? dateTime.getDate() : "0" + dateTime.getDate();
        let month = dateTime.getMonth() + 1 > 9 ? dateTime.getMonth() + 1 : "0" + (dateTime.getMonth() + 1);
        let year = dateTime.getFullYear();
        return `${hour}:${minute} | ${day}/${month}/${year}`;
    }
}