const expander_mixin = {
    data: function () {
        return {
            show_list: false,
        }
    },
    methods: {
        toggleList: function() {
            this.show_list = !this.show_list;
        },
    }
};

export default expander_mixin;
