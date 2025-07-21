import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  BookOpen, 
  Plus, 
  Search, 
  QrCode, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  BookMarked,
  Users,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  publishYear: number;
  totalCopies: number;
  availableCopies: number;
  description: string;
  imageUrl?: string;
  addedDate: string;
  tags: string[];
}

interface BookIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue';
  fineAmount?: number;
}

const BOOK_CATEGORIES = [
  'Science',
  'Mathematics',
  'Literature',
  'History',
  'Technology',
  'Biography',
  'Reference',
  'Fiction',
  'Non-Fiction',
  'Educational'
];

export const LibraryPanel = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookIssues, setBookIssues] = useState<BookIssue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isIssueBookOpen, setIsIssueBookOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    publisher: '',
    publishYear: new Date().getFullYear(),
    totalCopies: 1,
    description: '',
    imageUrl: '',
    tags: ''
  });
  const [issueForm, setIssueForm] = useState({
    studentName: '',
    studentId: '',
    dueDate: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadLibraryData();
  }, []);

  const loadLibraryData = () => {
    // Mock data for demonstration
    const mockBooks: Book[] = [
      {
        id: '1',
        title: 'Physics Fundamentals',
        author: 'Dr. John Smith',
        isbn: '978-0123456789',
        category: 'Science',
        publisher: 'Academic Press',
        publishYear: 2023,
        totalCopies: 5,
        availableCopies: 3,
        description: 'Comprehensive guide to physics concepts',
        imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop',
        addedDate: '2024-01-15',
        tags: ['physics', 'science', 'education']
      },
      {
        id: '2',
        title: 'Advanced Mathematics',
        author: 'Prof. Sarah Johnson',
        isbn: '978-9876543210',
        category: 'Mathematics',
        publisher: 'Math Publications',
        publishYear: 2023,
        totalCopies: 3,
        availableCopies: 1,
        description: 'Advanced mathematical concepts and applications',
        imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=200&h=300&fit=crop',
        addedDate: '2024-01-10',
        tags: ['mathematics', 'calculus', 'algebra']
      },
      {
        id: '3',
        title: 'World History',
        author: 'Dr. Michael Brown',
        isbn: '978-1122334455',
        category: 'History',
        publisher: 'History Books Inc',
        publishYear: 2022,
        totalCopies: 4,
        availableCopies: 4,
        description: 'Comprehensive world history from ancient to modern times',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop',
        addedDate: '2024-01-05',
        tags: ['history', 'world', 'ancient', 'modern']
      }
    ];

    const mockIssues: BookIssue[] = [
      {
        id: '1',
        bookId: '1',
        bookTitle: 'Physics Fundamentals',
        studentId: 'STU001',
        studentName: 'Alice Johnson',
        issueDate: '2024-01-20',
        dueDate: '2024-02-20',
        status: 'issued'
      },
      {
        id: '2',
        bookId: '2',
        bookTitle: 'Advanced Mathematics',
        studentId: 'STU002',
        studentName: 'Bob Wilson',
        issueDate: '2024-01-18',
        dueDate: '2024-02-18',
        status: 'overdue',
        fineAmount: 50
      }
    ];

    setBooks(mockBooks);
    setBookIssues(mockIssues);
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.isbn.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddBook = () => {
    if (!newBook.title || !newBook.author || !newBook.isbn) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const book: Book = {
      id: Date.now().toString(),
      ...newBook,
      availableCopies: newBook.totalCopies,
      addedDate: new Date().toISOString().split('T')[0],
      tags: newBook.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    setBooks(prev => [...prev, book]);
    setNewBook({
      title: '',
      author: '',
      isbn: '',
      category: '',
      publisher: '',
      publishYear: new Date().getFullYear(),
      totalCopies: 1,
      description: '',
      imageUrl: '',
      tags: ''
    });
    setIsAddBookOpen(false);

    toast({
      title: "Success",
      description: "Book added successfully to library"
    });
  };

  const handleIssueBook = () => {
    if (!selectedBook || !issueForm.studentName || !issueForm.studentId || !issueForm.dueDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (selectedBook.availableCopies <= 0) {
      toast({
        title: "Error",
        description: "No copies available for this book",
        variant: "destructive"
      });
      return;
    }

    const issue: BookIssue = {
      id: Date.now().toString(),
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      studentId: issueForm.studentId,
      studentName: issueForm.studentName,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: issueForm.dueDate,
      status: 'issued'
    };

    setBookIssues(prev => [...prev, issue]);
    setBooks(prev => prev.map(book => 
      book.id === selectedBook.id 
        ? { ...book, availableCopies: book.availableCopies - 1 }
        : book
    ));

    setIssueForm({ studentName: '', studentId: '', dueDate: '' });
    setSelectedBook(null);
    setIsIssueBookOpen(false);

    toast({
      title: "Success",
      description: "Book issued successfully"
    });
  };

  const handleReturnBook = (issueId: string) => {
    setBookIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, status: 'returned' as const, returnDate: new Date().toISOString().split('T')[0] }
        : issue
    ));

    const issue = bookIssues.find(i => i.id === issueId);
    if (issue) {
      setBooks(prev => prev.map(book => 
        book.id === issue.bookId 
          ? { ...book, availableCopies: book.availableCopies + 1 }
          : book
      ));
    }

    toast({
      title: "Success",
      description: "Book returned successfully"
    });
  };

  const generateQRCode = (book: Book) => {
    // In a real app, this would generate an actual QR code
    const qrData = `BOOK:${book.isbn}:${book.title}:${book.author}`;
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`, '_blank');
  };

  const getStatusBadge = (status: BookIssue['status']) => {
    const variants = {
      issued: 'default',
      returned: 'secondary',
      overdue: 'destructive'
    } as const;

    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          📚 Library Resource Management
        </h2>
        <p className="text-muted-foreground">
          Manage books, track inventory, and handle issue/return operations
        </p>
      </motion.div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-fit">
          <TabsTrigger value="inventory">Book Inventory</TabsTrigger>
          <TabsTrigger value="issues">Issue/Return</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Search and Filters */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search books by title, author, or ISBN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {BOOK_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
                  <DialogTrigger asChild>
                    <Button className="whitespace-nowrap">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Book
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Book</DialogTitle>
                      <DialogDescription>
                        Add a new book to your library inventory
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={newBook.title}
                          onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Book title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author">Author *</Label>
                        <Input
                          id="author"
                          value={newBook.author}
                          onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                          placeholder="Author name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="isbn">ISBN *</Label>
                        <Input
                          id="isbn"
                          value={newBook.isbn}
                          onChange={(e) => setNewBook(prev => ({ ...prev, isbn: e.target.value }))}
                          placeholder="978-0000000000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={newBook.category} onValueChange={(value) => setNewBook(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {BOOK_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="publisher">Publisher</Label>
                        <Input
                          id="publisher"
                          value={newBook.publisher}
                          onChange={(e) => setNewBook(prev => ({ ...prev, publisher: e.target.value }))}
                          placeholder="Publisher name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="publishYear">Publication Year</Label>
                        <Input
                          id="publishYear"
                          type="number"
                          value={newBook.publishYear}
                          onChange={(e) => setNewBook(prev => ({ ...prev, publishYear: parseInt(e.target.value) }))}
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalCopies">Total Copies</Label>
                        <Input
                          id="totalCopies"
                          type="number"
                          value={newBook.totalCopies}
                          onChange={(e) => setNewBook(prev => ({ ...prev, totalCopies: parseInt(e.target.value) }))}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="imageUrl">Cover Image URL</Label>
                        <Input
                          id="imageUrl"
                          value={newBook.imageUrl}
                          onChange={(e) => setNewBook(prev => ({ ...prev, imageUrl: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newBook.description}
                          onChange={(e) => setNewBook(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Book description..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          value={newBook.tags}
                          onChange={(e) => setNewBook(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="physics, science, education"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddBookOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddBook}>Add Book</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card hover-scale h-full">
                  <CardContent className="p-4 space-y-3">
                    {book.imageUrl && (
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={book.imageUrl} 
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        by {book.author}
                      </p>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          {book.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {book.availableCopies}/{book.totalCopies} available
                        </span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {book.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => generateQRCode(book)}
                      >
                        <QrCode className="h-3 w-3 mr-1" />
                        QR
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedBook(book);
                          setIsIssueBookOpen(true);
                        }}
                        disabled={book.availableCopies === 0}
                      >
                        <BookMarked className="h-3 w-3 mr-1" />
                        Issue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookMarked className="h-5 w-5" />
                  Active Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">
                  {bookIssues.filter(issue => issue.status === 'issued').length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Books currently issued
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">
                  {bookIssues.filter(issue => issue.status === 'overdue').length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Books overdue for return
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Total Returns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {bookIssues.filter(issue => issue.status === 'returned').length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Books successfully returned
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Issue/Return Management</CardTitle>
              <CardDescription>
                Track book issues and manage returns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookIssues.map(issue => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-medium">{issue.bookTitle}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{issue.studentName}</div>
                          <div className="text-sm text-muted-foreground">{issue.studentId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(issue.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(issue.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(issue.status)}</TableCell>
                      <TableCell>
                        {issue.status === 'issued' || issue.status === 'overdue' ? (
                          <Button
                            size="sm"
                            onClick={() => handleReturnBook(issue.id)}
                          >
                            Return Book
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Completed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Books
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{books.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  In library inventory
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Available Copies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {books.reduce((sum, book) => sum + book.availableCopies, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ready for issue
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(books.map(book => book.category)).size}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Different categories
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Issue Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {books.length > 0 ? Math.round(((books.reduce((sum, book) => sum + book.totalCopies, 0) - books.reduce((sum, book) => sum + book.availableCopies, 0)) / books.reduce((sum, book) => sum + book.totalCopies, 0)) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Books currently issued
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Library Reports</CardTitle>
              <CardDescription>
                Generate and download various library reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Book Inventory Report
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Issue/Return Report
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Overdue Books Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Issue Book Dialog */}
      <Dialog open={isIssueBookOpen} onOpenChange={setIsIssueBookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Book</DialogTitle>
            <DialogDescription>
              Issue "{selectedBook?.title}" to a student
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name *</Label>
              <Input
                id="studentName"
                value={issueForm.studentName}
                onChange={(e) => setIssueForm(prev => ({ ...prev, studentName: e.target.value }))}
                placeholder="Enter student name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID *</Label>
              <Input
                id="studentId"
                value={issueForm.studentId}
                onChange={(e) => setIssueForm(prev => ({ ...prev, studentId: e.target.value }))}
                placeholder="Enter student ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={issueForm.dueDate}
                onChange={(e) => setIssueForm(prev => ({ ...prev, dueDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIssueBookOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleIssueBook}>Issue Book</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};