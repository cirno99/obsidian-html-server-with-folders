# Obsidian HTML Server (Forked)

> This is a fork of the original [Obsidian HTML Server](https://github.com/Pr0dt0s/obsidian-html-server) plugin by [Pr0dt0s](https://github.com/Pr0dt0s). The original project hasn't been maintained since 2022, but I've added some personal improvements for my own use.

This plugin allows you to serve your Obsidian vault as an HTTP server, while maintaining your theme and ensuring that your image and file links work.

## Added Features in This Fork
- File explorer sidebar for easier navigation through vault documents

## Usage
Simply enable the plugin, start the server and open a web browser at `http://localhost:8080/A_MARKDOWN_FILE` to view the same document you see when opening it in Obsidian. Use the sidebar file explorer to navigate between documents in your vault.

## Notes
- This plugin is intended for sharing your vault within a local network.
- The server is view-only, meaning that no one can change the files in your vault.
- All of the themes and customizations that are visible in Obsidian will be available in the browser.
- Interactivity has not been implemented yet.

## Tips
- To access the server on your local machine, you can use `localhost`. However, for other devices on your network, you will need to use your IP address.
- Create a markdown file with links to other files and use it as an index page (default page), which you can set in your settings.
- If there is an error starting the server, it might be because the port is already in use. In this case, simply change the port to another number.
- You can use [ngrok](https://ngrok.com/) to share your vault openly with someone outside of your local network.

## Maintenance Status
This fork was created for personal use and includes some quality-of-life improvements I needed. While I may update it occasionally for my own needs, I'm not actively maintaining it as a public project. The code quality might not be up to production standards as it was developed for personal use.

Feel free to use it as is, fork it further, or refer to the original repository for any serious development work.

## Credits
- Original plugin by [Pr0dt0s](https://github.com/Pr0dt0s) - [Original Repository](https://github.com/Pr0dt0s/obsidian-html-server)
- If you appreciate the original work, consider supporting Pr0dt0s through their [Buy Me a Coffee](https://www.buymeacoffee.com/pr0dt0s) page

## Issues/Requests
While I'm not actively maintaining this fork, you can still:
- Check the [original repository](https://github.com/Pr0dt0s/obsidian-html-server/issues) for historical issues
- Fork this repository and make your own improvements
- Submit issues in this repository, but please note that I may not address them unless they align with my personal use cases

---

## License
This fork maintains the original license. See the LICENSE file for details.
