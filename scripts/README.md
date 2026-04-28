# scripts/

## build_kbdata.js

Regenerates `kbData.js` from the Reimagine Copilot KB markdown files.

When the KB is updated:

```sh
node scripts/build_kbdata.js path/to/Reimagine_Copilot_KB_v2.x kbData.js
```

The KB files this consumes:
- `Full_Template_Library.md` → `templateRules`
- `AEM_Component_Mapping.md` → `aemSignalMap`, `foundationOnlyTypes`
- `Template_Routing.md` → `templateRouting`

`knownBladeNames` is the union of:
- All required + optional blades across all templates
- All blade names referenced in the AEM signal map

Reload the extension after regenerating.
