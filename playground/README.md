# Touch Translation Plugin

A cross-platform translation plugin that provides powerful translation capabilities for Talex Touch.

## Features

- 🌐 **Multiple Translation Sources**: Supports Google Translate, Baidu Translate, Youdao Translate, and other translation services
- 🚀 **Smart Translation**: Automatically detects language and selects appropriate target language
- 💾 **Local Caching**: Avoids duplicate translations and improves response speed
- 📋 **Clipboard Integration**: Supports reading text from clipboard and copying results to clipboard
- 🔧 **Fallback Translation**: Provides local simple translation when online services are unavailable
- ⚡ **Hotkey Support**: Use `Ctrl+Alt+T` for quick translation

## Usage

### Basic Usage

1. **Selected Text Translation**: Select any text and press `Ctrl+Alt+T`
2. **Clipboard Translation**: Copy text to clipboard and press `Ctrl+Alt+T`
3. **Search Box Translation**: Enter text in Talex Touch search box and select translation feature

### Smart Translation Rules

- When Chinese is detected, automatically translates to English
- When other languages are detected, automatically translates to Chinese
- Supports automatic language detection

### Supported Languages

- Chinese (zh)
- English (en)
- Japanese (ja)
- Korean (ko)
- French (fr)
- German (de)
- Spanish (es)
- Russian (ru)

## Translation Services

### Google Translate (Default)

- Free service, no configuration required
- Supports multiple languages
- Fast response time

### Baidu Translate

- Requires API key configuration
- High-quality translation results
- Optimized for Chinese

### Youdao Translate

- Requires API key configuration
- Professional translation service
- Supports domain-specific translation

### Local Translation (Fallback)

- No network connection required
- Basic vocabulary translation
- Used as fallback option

## Data Storage

The plugin stores the following data locally:

- `translation_cache`: Translation result cache
- `translation_services`: Translation service configuration

Data storage location: `{plugin_directory}/data/`

## Development

### Plugin Structure

```
touch-translation/
├── index.js          # Main logic file
├── manifest.json     # Plugin configuration file
├── preload.js        # Preload script
├── README.md         # Documentation
└── data/             # Data storage directory
    ├── translation_cache.json
    └── translation_services.json
```

### API Interface

The plugin provides the following main functions:

- `translate(text, from, to, service)`: Translate text
- `smartTranslate(text)`: Smart translation
- `detectLanguage(text)`: Language detection

## Troubleshooting

### Translation Failure

1. Check network connection
2. Verify translation service availability
3. Check console error messages

### Cache Issues

- Clear cache: Delete `data/translation_cache.json` file

### Configuration Issues

- Reset configuration: Delete `data/translation_services.json` file

## Changelog

### v1.0.0-Alpha

- Initial release
- Google Translate support
- Local caching functionality
- Clipboard integration
- Smart translation feature

## License

This plugin follows the Talex Touch license agreement.

## Contributing

Issues and Pull Requests are welcome to improve this plugin.

## Contact

For questions or suggestions, please contact us through official Talex Touch channels.
