How to package Reattivio for the App Center:

1. You must have the packager and validator files provided by Cisco in this directory
>Note: they are not here by default and must be obtained from Cisco DevNet

2. Update version `app/app.json` if necessary
3. Run `./build-aci-app.sh`
>Will build Reattivio, copy assets then build, validate, and package as a .aci app

4. Upload `Cisco-Reattivio-x.x.aci` to your APIC
