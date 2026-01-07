package service;

import db.Database;
import model.*;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class HymnService {

    public void createHymn(int number, String title, String lyrics,
                           String authorName, String keyName) {

        try (Connection conn = Database.connect()) {
            conn.setAutoCommit(false);

            int authorId = getOrCreateAuthor(conn, authorName);
            int keyId = getOrCreateKey(conn, keyName);

            String sql = "INSERT INTO hymns(number, title, lyrics, author_id, key_id) VALUES(?,?,?,?,?)";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, number);
                ps.setString(2, title);
                ps.setString(3, lyrics);
                ps.setInt(4, authorId);
                ps.setInt(5, keyId);
                ps.executeUpdate();
            }

            conn.commit();
            System.out.println("Hymn added successfully.");

        } catch (SQLException e) {
            System.out.println("Error creating hymn.");
        }
    }

    private int getOrCreateAuthor(Connection conn, String name) throws SQLException {
        String select = "SELECT id FROM authors WHERE name=?";
        try (PreparedStatement ps = conn.prepareStatement(select)) {
            ps.setString(1, name);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt("id");
        }

        String insert = "INSERT INTO authors(name) VALUES(?)";
        try (PreparedStatement ps = conn.prepareStatement(insert, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, name);
            ps.executeUpdate();
            ResultSet rs = ps.getGeneratedKeys();
            rs.next();
            return rs.getInt(1);
        }
    }

    private int getOrCreateKey(Connection conn, String name) throws SQLException {
        String select = "SELECT id FROM keys WHERE name=?";
        try (PreparedStatement ps = conn.prepareStatement(select)) {
            ps.setString(1, name);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt("id");
        }

        String insert = "INSERT INTO keys(name) VALUES(?)";
        try (PreparedStatement ps = conn.prepareStatement(insert, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, name);
            ps.executeUpdate();
            ResultSet rs = ps.getGeneratedKeys();
            rs.next();
            return rs.getInt(1);
        }
    }

    public List<Hymn> listHymns() {
        List<Hymn> hymns = new ArrayList<>();

        String sql = """
            SELECT h.id, h.number, h.title, h.lyrics,
                   a.id AS author_id, a.name AS author_name,
                   k.id AS key_id, k.name AS key_name
            FROM hymns h
            JOIN authors a ON h.author_id = a.id
            JOIN keys k ON h.key_id = k.id
        """;

        try (Connection conn = Database.connect();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                Author author = new Author(rs.getInt("author_id"), rs.getString("author_name"));
                Key key = new Key(rs.getInt("key_id"), rs.getString("key_name"));

                hymns.add(new Hymn(
                        rs.getInt("id"),
                        rs.getInt("number"),
                        rs.getString("title"),
                        rs.getString("lyrics"),
                        author,
                        key
                ));
            }
        } catch (SQLException e) {
            System.out.println("Error listing hymns.");
        }

        return hymns;
    }

    public void deleteHymn(int id) {
        try (Connection conn = Database.connect();
             PreparedStatement ps = conn.prepareStatement(
                     "DELETE FROM hymns WHERE id=?")) {

            ps.setInt(1, id);
            int rows = ps.executeUpdate();

            if (rows > 0)
                System.out.println("Hymn deleted.");
            else
                System.out.println("Hymn not found.");

        } catch (SQLException e) {
            System.out.println("Error deleting hymn.");
        }
    }
}

