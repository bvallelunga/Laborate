module.exports = function(ejs) {
    ejs.filters.capitalize = function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
}