# Orbit API

## Overview

Orbit API adalah platform web untuk melakukan pengujian API, menyimpan request dan response, serta membagikan koleksi API kepada pengguna lain.

Target pengguna:

* Backend Developer
* Frontend Developer
* Mobile Developer
* QA Tester
* Mahasiswa yang sedang belajar API

Tujuan utama:

* Alternatif Postman berbasis web.
* Menyimpan seluruh histori request dan response.
* Memungkinkan berbagi koleksi API melalui link publik.
* Memiliki UI yang sederhana dan cepat.

---

# Core Features

## 1. API Request Testing

Pengguna dapat mengirim request HTTP:

Supported Methods:

* GET
* POST
* PUT
* PATCH
* DELETE

Request Configuration:

* URL
* Query Parameters
* Headers
* Body

Supported Body Types:

* JSON
* Form Data
* x-www-form-urlencoded
* Raw Text

---

## 2. Response Viewer

Menampilkan:

* Status Code
* Response Time
* Response Size
* Headers
* JSON Response

Fitur tambahan:

* Syntax Highlighting
* Pretty JSON Formatter
* Copy Response
* Download Response

---

## 3. Request History

Semua request disimpan otomatis.

Data yang disimpan:

* Method
* URL
* Headers
* Body
* Timestamp
* Response

Fitur:

* Search History
* Delete History
* Favorite Request

---

## 4. Collections

Pengguna dapat membuat koleksi API.

Contoh:

Collection:

* Authentication
* User API
* Product API

Setiap koleksi dapat memiliki banyak endpoint.

---

## 5. Share Collections

Pengguna dapat membagikan koleksi melalui link.

Contoh:

https://orbitapi.com/share/abc123

Mode:

* Public
* Unlisted
* Private

---

## 6. Team Workspace

Workspace berisi:

* Members
* Collections
* Shared Requests

Roles:

* Owner
* Admin
* Editor
* Viewer

---

## 7. Environment Variables

Contoh:

BASE_URL=https://api.example.com
TOKEN=abc123

Penggunaan:

{{BASE_URL}}/users

Header:

Authorization: Bearer {{TOKEN}}

---

## 8. Import & Export

Import:

* JSON Collection

Export:

* JSON
* CSV

Future:

* Postman Collection Import

---

# Authentication

Supported:

* Email & Password
* Google Login

User Features:

* Profile
* Settings
* API Usage

---

# Dashboard

Menampilkan:

* Total Requests
* Collections Count
* Shared Collections
* Recent Activity

---

# Tech Stack

Frontend:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* TanStack Query

Backend:

* Next.js API Routes atau NestJS

Database:

* PostgreSQL

ORM:

* Prisma

Authentication:

* Better Auth

Storage:

* PostgreSQL

Deployment:

* Vercel
* Neon Database

---

# Database Design

## users

* id
* name
* email
* avatar
* created_at

## collections

* id
* user_id
* name
* description
* visibility

## requests

* id
* collection_id
* method
* url
* headers
* body

## responses

* id
* request_id
* status_code
* response_time
* response_body

## workspaces

* id
* owner_id
* name

## workspace_members

* id
* workspace_id
* user_id
* role

---

# UI Pages

## Public

* Landing Page
* Pricing
* Login
* Register

## Authenticated

* Dashboard
* API Tester
* Collections
* History
* Workspaces
* Settings

---

# MVP Phase

Version 1 harus memiliki:

* Login
* API Testing
* Response Viewer
* History
* Collections
* Share Link

Jangan implementasikan fitur Team Workspace terlebih dahulu.

Prioritas utama adalah pengalaman testing API yang cepat dan stabil.

---

# Future Features

* AI Request Generator
* AI API Documentation Generator
* GraphQL Support
* WebSocket Testing
* gRPC Testing
* OpenAPI Import
* Rate Limiting Monitor
* API Health Monitor
* Scheduled Requests
* Mock API Generator

---

# Coding Rules

* Gunakan TypeScript strict mode.
* Gunakan Clean Architecture.
* Pisahkan domain, application, infrastructure, dan presentation layer.
* Gunakan Server Actions jika memungkinkan.
* Hindari duplicated code.
* Semua endpoint harus memiliki validation.
* Semua database access melalui repository pattern.
* Semua komponen harus reusable.
* Tulis kode production-ready.

# Orbit API - Advanced API Snapshot System

## Main Concept

Orbit API bukan hanya alat untuk mengirim request API.

Orbit API memungkinkan developer:

1. Menguji endpoint.
2. Menyimpan hasil endpoint sebagai snapshot.
3. Melihat perubahan response dari waktu ke waktu.
4. Mendokumentasikan endpoint secara otomatis.
5. Membagikan dokumentasi endpoint kepada tim.

---

# Endpoint Registry

Setiap endpoint memiliki identitas tetap.

Contoh:

Base URL:
https://api.company.com

Endpoint:
GET /users

Orbit API akan menyimpan:

* Method
* Path
* Description
* Tags
* Headers
* Query Parameters
* Request Body Schema
* Response Schema

---

# Snapshot Versioning

Setiap kali developer melakukan testing dan menekan tombol Save Snapshot:

Orbit API membuat versi baru.

Contoh:

GET /users

Version 1
Created: 2026-06-15

Response:

{
"id": 1,
"name": "Ali"
}

Version 2
Created: 2026-06-20

Response:

{
"id": 1,
"name": "Ali",
"email": "[ali@example.com](mailto:ali@example.com)"
}

Version 3
Created: 2026-07-01

Response:

{
"id": 1,
"full_name": "Ali"
}

---

# Response Diff Viewer

User dapat membandingkan dua snapshot.

Contoh:

Version 1

{
"id": 1,
"name": "Ali"
}

Version 2

{
"id": 1,
"name": "Ali",
"email": "[ali@example.com](mailto:ali@example.com)"
}

Diff:

* email

Version 2

{
"id": 1,
"name": "Ali",
"email": "[ali@example.com](mailto:ali@example.com)"
}

Version 3

{
"id": 1,
"full_name": "Ali"
}

Diff:

* name

- full_name

---

# API Documentation

Setiap endpoint memiliki halaman dokumentasi otomatis.

Contoh:

GET /users

Description:
Mengambil daftar pengguna.

Headers:

Authorization: Bearer Token

Query Parameters:

page
integer

limit
integer

Response Example:

{
"data": []
}

---

# Parameter Documentation

Developer dapat mendefinisikan parameter.

Contoh:

page

Type:
integer

Required:
false

Description:
Nomor halaman.

---

# Request Body Documentation

POST /users

Body:

{
"name": "string",
"email": "string"
}

Field Documentation:

name
Type: string
Required: true

email
Type: string
Required: true

---

# Example Library

Satu endpoint dapat memiliki banyak contoh request.

Contoh:

Create User - Example 1

{
"name": "Ali"
}

Create User - Example 2

{
"name": "Budi"
}

---

# Environment Support

Development

https://dev-api.company.com

Staging

https://staging-api.company.com

Production

https://api.company.com

Endpoint yang sama dapat diuji pada berbagai environment.

---

# Shareable Documentation

Dokumentasi dapat dibagikan.

Contoh:

/docs/project-a

Tampilan mirip Swagger.

Tetapi memiliki:

* Version History
* Response Snapshots
* Response Diff
* Example Library

---

# Smart Schema Detection

Saat response disimpan:

{
"id": 1,
"name": "Ali",
"active": true
}

Orbit API otomatis menghasilkan schema:

id:
number

name:
string

active:
boolean

---

# Primary Differentiator

Postman:
Berfokus pada request.

Swagger:
Berfokus pada dokumentasi.

Orbit API:
Berfokus pada evolusi endpoint.

Developer dapat melihat bagaimana endpoint berubah dari waktu ke waktu melalui snapshot dan versioning.

