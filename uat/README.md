# Acceptance Testing (UAT)

This directory contains the user acceptance testing suite for Pelilauta.

> **Pre-merge / release acceptance only:** Do not run these acceptance tests during in-flight development or unit testing loops. The acceptance suite resets Firestore, uploads assets, and takes significant time. Run only for release acceptance before merging to `main`.
