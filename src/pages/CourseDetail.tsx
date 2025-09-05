import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Edit,
  Save,
  X,
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  File,
  Clock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface Course {
  id: string;
  title: string;
  description: string;
  color: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CourseNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface CourseFile {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [showNewNote, setShowNewNote] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  const fetchCourseData = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (courseError) throw courseError;
      if (!courseData) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Cours introuvable",
        });
        navigate('/courses');
        return;
      }

      setCourse(courseData);
      setEditForm({ title: courseData.title, description: courseData.description || '' });

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('course_notes')
        .select('*')
        .eq('course_id', id)
        .order('updated_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

      // Fetch files
      const { data: filesData, error: filesError } = await supabase
        .from('course_files')
        .select('*')
        .eq('course_id', id)
        .order('created_at', { ascending: false });

      if (filesError) throw filesError;
      setFiles(filesData || []);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données du cours",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async () => {
    if (!course) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: editForm.title,
          description: editForm.description
        })
        .eq('id', course.id);

      if (error) throw error;

      setCourse({ ...course, title: editForm.title, description: editForm.description });
      setEditing(false);
      toast({
        title: "Cours mis à jour",
        description: "Les modifications ont été sauvegardées",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
      });
    }
  };

  const createNote = async () => {
    if (!newNote.title.trim() || !course) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from('course_notes')
        .insert({
          course_id: course.id,
          user_id: session.user.id,
          title: newNote.title,
          content: newNote.content
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNote({ title: '', content: '' });
      setShowNewNote(false);
      toast({
        title: "Note créée",
        description: "Votre note a été ajoutée avec succès",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la note",
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('course_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteId));
      toast({
        title: "Note supprimée",
        description: "La note a été supprimée avec succès",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer la note",
      });
    }
  };

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !course) return;

    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Non authentifié");

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${course.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data, error: dbError } = await supabase
        .from('course_files')
        .insert({
          course_id: course.id,
          user_id: session.user.id,
          filename: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setFiles([data, ...files]);
      toast({
        title: "Fichier uploadé",
        description: "Votre fichier a été ajouté avec succès",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'uploader le fichier",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (file: CourseFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-files')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
      });
    }
  };

  const deleteFile = async (file: CourseFile) => {
    try {
      await supabase.storage.from('course-files').remove([file.file_path]);
      
      const { error } = await supabase
        .from('course_files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;

      setFiles(files.filter(f => f.id !== file.id));
      toast({
        title: "Fichier supprimé",
        description: "Le fichier a été supprimé avec succès",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Cours introuvable</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/courses')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          {editing ? (
            <div className="space-y-2">
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Titre du cours"
                className="text-2xl font-bold"
              />
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Description du cours"
                rows={2}
              />
              <div className="flex space-x-2">
                <Button onClick={updateCourse} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditing(false)} 
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: course.color }}
                />
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {course.title}
                </h1>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mt-2">
                {course.description || "Aucune description"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="files">Fichiers</TabsTrigger>
        </TabsList>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Notes du cours</h2>
            <Button 
              onClick={() => setShowNewNote(true)}
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle note
            </Button>
          </div>

          {showNewNote && (
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle>Créer une nouvelle note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="note-title">Titre de la note</Label>
                  <Input
                    id="note-title"
                    placeholder="Titre de la note..."
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="note-content">Contenu</Label>
                  <Textarea
                    id="note-content"
                    placeholder="Écrivez votre note ici..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    rows={6}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={createNote}
                    disabled={!newNote.title.trim()}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Créer la note
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowNewNote(false);
                      setNewNote({ title: '', content: '' });
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {notes.length === 0 ? (
            <Card className="shadow-card border-0">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune note pour le moment</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Créez votre première note pour ce cours
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="shadow-card border-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(note.updated_at).toLocaleDateString('fr-FR')}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-sm">
                      {note.content || "Aucun contenu"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Fichiers du cours</h2>
            <div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={uploadFile}
                disabled={uploading}
              />
              <Button 
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading}
                className="bg-gradient-accent hover:opacity-90 shadow-glow"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Upload...' : 'Uploader un fichier'}
              </Button>
            </div>
          </div>

          {files.length === 0 ? (
            <Card className="shadow-card border-0">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <File className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun fichier pour le moment</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Uploadez votre premier fichier pour ce cours
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <Card key={file.id} className="shadow-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <File className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{file.filename}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{formatFileSize(file.file_size)}</span>
                            <span>•</span>
                            <span>{new Date(file.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => downloadFile(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteFile(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}