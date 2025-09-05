import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Plus, 
  Search,
  Clock,
  CheckCircle2,
  Archive,
  Filter,
  Grid3X3,
  List
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  id: string;
  title: string;
  description: string;
  color: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les cours",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCourseStatus = async (courseId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ status })
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.map(course => 
        course.id === courseId ? { ...course, status } : course
      ));

      toast({
        title: "Statut mis à jour",
        description: "Le statut du cours a été modifié avec succès",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le statut",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'archived':
        return <Archive className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
      case 'completed':
        return 'bg-success text-success-foreground hover:bg-success/90';
      case 'archived':
        return 'bg-muted text-muted-foreground hover:bg-muted/90';
      default:
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/90';
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse shadow-card border-0">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Mes cours
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez tous vos cours en un seul endroit
          </p>
        </div>
        <Button 
          onClick={() => navigate('/courses/new')}
          className="bg-gradient-primary hover:opacity-90 shadow-glow"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau cours
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un cours..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="completed">Terminés</SelectItem>
              <SelectItem value="archived">Archivés</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Courses Grid/List */}
      {filteredCourses.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Aucun cours trouvé' : 'Aucun cours pour le moment'}
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Essayez de modifier vos critères de recherche' 
                : 'Créez votre premier cours pour commencer à organiser vos études'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button 
                onClick={() => navigate('/courses/new')}
                className="bg-gradient-primary hover:opacity-90 shadow-glow"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un cours
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredCourses.map((course) => (
            viewMode === 'grid' ? (
              <Card 
                key={course.id} 
                className="shadow-card border-0 hover:shadow-glow transition-all cursor-pointer group"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div 
                      className="w-4 h-4 rounded-full group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: course.color }}
                    />
                    <Badge 
                      className={`cursor-pointer ${getStatusColor(course.status)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStatus = course.status === 'active' ? 'completed' : 
                                        course.status === 'completed' ? 'archived' : 'active';
                        updateCourseStatus(course.id, newStatus);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(course.status)}
                        {course.status}
                      </div>
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {course.description || "Aucune description"}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Mis à jour {new Date(course.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card 
                key={course.id} 
                className="shadow-card border-0 hover:shadow-glow transition-all cursor-pointer"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div 
                        className="w-3 h-8 rounded-full"
                        style={{ backgroundColor: course.color }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {course.description || "Aucune description"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge 
                        className={`cursor-pointer ${getStatusColor(course.status)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newStatus = course.status === 'active' ? 'completed' : 
                                          course.status === 'completed' ? 'archived' : 'active';
                          updateCourseStatus(course.id, newStatus);
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(course.status)}
                          {course.status}
                        </div>
                      </Badge>
                      <div className="text-xs text-muted-foreground text-right">
                        Mis à jour<br />
                        {new Date(course.updated_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  );
}