const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Note = require('../models/Note');

describe('Notes API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/notes-api-test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Note.deleteMany({});
  });

  describe('GET /api/notes', () => {
    it('should return 200 and all notes', async () => {
      const note1 = await Note.create({
        title: 'Test Note 1',
        content: 'Test Content 1'
      });

      const note2 = await Note.create({
        title: 'Test Note 2',
        content: 'Test Content 2'
      });

      const response = await request(app)
        .get('/api/notes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data.length).toBe(2);
    });

    it('should return 404 when no notes found', async () => {
      const response = await request(app)
        .get('/api/notes')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No notes found');
    });
  });

  describe('GET /api/note/:id', () => {
    it('should return 200 and note by ID', async () => {
      const note = await Note.create({
        title: 'Test Note',
        content: 'Test Content'
      });

      const response = await request(app)
        .get(`/api/note/${note._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Note');
      expect(response.body.data.content).toBe('Test Content');
    });

    it('should return 404 when note not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/note/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });
  });

  describe('GET /api/note/read/:title', () => {
    it('should return 200 and note by title', async () => {
      const note = await Note.create({
        title: 'Unique Title',
        content: 'Test Content'
      });

      const response = await request(app)
        .get('/api/note/read/Unique Title')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Unique Title');
    });

    it('should return 404 when note not found by title', async () => {
      const response = await request(app)
        .get('/api/note/read/NonExistentTitle')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });
  });

  describe('POST /api/note', () => {
    it('should return 201 and create new note', async () => {
      const noteData = {
        title: 'New Note',
        content: 'New Content'
      };

      const response = await request(app)
        .post('/api/note')
        .send(noteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Note');
      expect(response.body.data.content).toBe('New Content');
      expect(response.body.data.created).toBeDefined();
      expect(response.body.data.changed).toBeDefined();
    });

    it('should return 409 when note with same title exists', async () => {
      await Note.create({
        title: 'Duplicate Title',
        content: 'Content 1'
      });

      const noteData = {
        title: 'Duplicate Title',
        content: 'Content 2'
      };

      const response = await request(app)
        .post('/api/note')
        .send(noteData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note with this title already exists');
    });
  });

  describe('PUT /api/note/:id', () => {
    it('should return 204 and update note', async () => {
      const note = await Note.create({
        title: 'Original Title',
        content: 'Original Content'
      });

      const updateData = {
        title: 'Updated Title',
        content: 'Updated Content'
      };

      const response = await request(app)
        .put(`/api/note/${note._id}`)
        .send(updateData)
        .expect(204);

      expect(response.body.success).toBe(true);
      
      // Verify the note was updated
      const updatedNote = await Note.findById(note._id);
      expect(updatedNote.title).toBe('Updated Title');
      expect(updatedNote.content).toBe('Updated Content');
    });

    it('should return 404 when updating non-existent note', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        title: 'Updated Title',
        content: 'Updated Content'
      };

      const response = await request(app)
        .put(`/api/note/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/note/:id', () => {
    it('should return 204 and delete note', async () => {
      const note = await Note.create({
        title: 'Note to Delete',
        content: 'Content to delete'
      });

      const response = await request(app)
        .delete(`/api/note/${note._id}`)
        .expect(204);

      expect(response.body.success).toBe(true);
      
      // Verify the note was deleted
      const deletedNote = await Note.findById(note._id);
      expect(deletedNote).toBeNull();
    });

    it('should return 404 when deleting non-existent note', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/note/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
