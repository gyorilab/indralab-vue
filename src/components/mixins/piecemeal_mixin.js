const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};


const piecemeal_mixin = {
    props: {
        autoload: {
            type: Boolean,
            default: false
        }
    },
    data: function() {
        return {
            end_n: 0,
            dn: 10,
            bottom: false,
        }
    },
    created: function() {
        if (!this.autoload) {
            if (!this.base_list)
                this.end_n = 0
            else
                this.end_n = 10;
            return;
        }
        window.console.log("Adding event listener to scroll.");
        window.addEventListener('scroll', this.updateBottom);

        this.loadMore();
    },
    destroyed: function() {
        window.console.log("Removing event listener to scroll.");
        window.removeEventListener('scroll', this.updateBottom)
    },
    computed: {
        list_shown: function() {
            if (!this.base_list)
                return;
            return this.base_list.slice(0, this.end_n);
        },
        next_batch: function() {
            let L;
            if (this.base_list != null)
                L = this.base_list.length;
            else
                L = 0
            return Math.min(L - this.end_n, this.dn);
        },
        show_buttons: function() {
            return this.next_batch > 0;
        }
    },
    methods: {
        loadMore: async function() {
            // If the list is currently not defined, just return.
            if (this.base_list == null)
                return 0;

            let num_loaded = 0;

            // If the list is fully loaded, there is nothing to do.
            if (this.end_n >= this.base_list.length) {
                if (this.getMore) {
                    window.console.log("Getting more...");
                    let got_more = await this.getMore();
                    if (!got_more) {
                        window.console.log("None gotten");
                        return;
                    } else {
                        window.console.log("More gotten.");
                    }
                } else {
                    return;
                }
            }

            // Lengthen the list.
            this.end_n += this.dn;
            num_loaded += this.dn;

            // If we're autoloading, check to see if we need to fill
            // in the page some more.
            if (this.autoload) {
                await sleep(100);
                if (this.bottomVisible()) {
                    num_loaded += await this.loadMore();
                }
            }

            return num_loaded;
        },

        loadAll: function() {
            if (!this.base_list) {
                this.end_n = 0
                return;
            }
            this.end_n = this.base_list.length;
        },

        bottomVisible: function() {
            const scrollY = window.scrollY;
            const visible = document.documentElement.clientHeight;
            const pageHeight = document.documentElement.scrollHeight;
            const bottomOfPage = visible + scrollY + 5 >= pageHeight;
            return bottomOfPage || pageHeight < visible;
        },

        updateBottom: function() {
            this.bottom = this.bottomVisible();
        }
    },
    watch: {
        bottom: function(bottom) {
            if (bottom) {
                this.loadMore().then();
            }
        },

        base_list: function(new_list, old_list) {
            // If both lists are the same object, the list must not have been replaced.
            if (old_list === new_list)
                return;

            if (!this.end_n)
                if (this.autoload)
                    this.end_n = 10;
                else
                    this.end_n = 0;
            this.bottom = false;

            this.loadMore().then();
        }
    }
};

export default piecemeal_mixin;
